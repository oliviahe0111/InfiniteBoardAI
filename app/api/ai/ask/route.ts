import { NextRequest, NextResponse } from "next/server";

import { authenticateAppRouterRequest } from "../../_auth";
import { createErrorResponse, parseJsonBody, handleCORS } from "../../_utils";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function OPTIONS() {
  return handleCORS();
}

export async function POST(request: NextRequest) {
  console.log("[API] POST /api/ai/ask");

  try {
    // Authenticate (no ownership check - already done at page level)
    const { user } = await authenticateAppRouterRequest();
    if (!user) {
      return createErrorResponse(
        401,
        "Authentication required",
        "unauthenticated"
      );
    }

    // Parse request
    let body: {
      boardId: string;
      rootId: string | null;
      parentId: string | null;
      question: string;
      quotedText?: string;
      position: { x: number; y: number };
    };

    try {
      body = await parseJsonBody(request);
    } catch {
      return createErrorResponse(400, "Invalid JSON", "invalid_json");
    }

    if (!body.question || !body.boardId || !body.position) {
      return createErrorResponse(
        400,
        "Missing required fields",
        "missing_fields"
      );
    }

    // Validate question length
    if (body.question.length > 500) {
      return createErrorResponse(
        400,
        "Question too long (max 500 chars)",
        "question_too_long"
      );
    }

    console.log(`[API] Processing AI request from user ${user.id}`);

    // Build conversation context
    const contextMessages = await buildContext(body.parentId, 6);

    // Prepare GitHub Models API call
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      console.error("[API] GitHub token not configured");
      return createErrorResponse(
        500,
        "LLM service not configured",
        "service_not_configured"
      );
    }

    // Call GitHub Models API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${githubToken}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful Q&A assistant for brainstorming and expanding ideas. Provide concise, creative, and actionable suggestions.",
            },
            ...contextMessages,
            ...(body.quotedText
              ? [
                  {
                    role: "system",
                    content: `User selected this text from previous answer: "${body.quotedText}"`,
                  },
                ]
              : []),
            {
              role: "user",
              content: body.question,
            },
          ],
          model: "gpt-4o-mini",
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 1,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[API] GitHub Models API error:", {
        status: response.status,
        error: errorText,
      });

      if (response.status === 401) {
        return createErrorResponse(500, "LLM auth failed", "llm_auth_failed");
      } else if (response.status === 429) {
        return createErrorResponse(
          429,
          "Rate limit exceeded",
          "llm_rate_limit"
        );
      } else {
        return createErrorResponse(
          500,
          "LLM service error",
          "llm_service_error"
        );
      }
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return createErrorResponse(
        500,
        "Invalid LLM response",
        "llm_invalid_response"
      );
    }

    const llmContent = data.choices[0].message.content.trim();

    // Calculate positions
    const questionX = body.position.x;
    const questionY = body.position.y;
    const answerX = questionX + 350; // 320px width + 30px gap
    const answerY = questionY;

    // Create question node
    let questionNode = await prisma.node.create({
      data: {
        boardId: body.boardId,
        type: body.parentId ? "followup_question" : "root_question",
        content: body.question,
        parentId: body.parentId || null,
        rootId: body.rootId || null,
        x: questionX,
        y: questionY,
        width: 450,
        height: 400,
      },
    });

    // For root questions, set rootId to self
    if (!body.rootId) {
      questionNode = await prisma.node.update({
        where: { id: questionNode.id },
        data: { rootId: questionNode.id },
      });
    }

    // Create answer node
    const answerNode = await prisma.node.create({
      data: {
        boardId: body.boardId,
        type: body.parentId ? "followup_answer" : "ai_answer",
        content: llmContent,
        parentId: questionNode.id,
        rootId: questionNode.rootId || questionNode.id,
        x: answerX,
        y: answerY,
        width: 320,
        height: 200,
      },
    });

    // Update board's updatedAt timestamp
    await prisma.board.update({
      where: { id: body.boardId },
      data: { updatedAt: new Date() },
    });

    console.log("[API] AI request completed successfully");

    return NextResponse.json({
      question: questionNode,
      answer: answerNode,
    });
  } catch (error: unknown) {
    console.error("[API] ai/ask POST error:", error);

    if (error instanceof Error && error.name === "AbortError") {
      return createErrorResponse(504, "Request timed out after 30s", "timeout");
    }

    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return createErrorResponse(500, errorMessage, "server_error");
  }
}

async function buildContext(parentId: string | null, maxDepth = 6) {
  if (!parentId) return [];

  const context: { role: string; content: string }[] = [];
  let currentNode: {
    id: string;
    type: string;
    content: string;
    parent: { id: string; type: string; content: string } | null;
  } | null = await prisma.node.findUnique({
    where: { id: parentId },
    include: { parent: true },
  });

  while (currentNode && context.length < maxDepth * 2) {
    context.unshift({
      role: currentNode.type.includes("question") ? "user" : "assistant",
      content: currentNode.content,
    });
    currentNode = currentNode.parent
      ? await prisma.node.findUnique({
          where: { id: currentNode.parent.id },
          include: { parent: true },
        })
      : null;
  }

  return context;
}
