import { createClient } from "@/lib/supabase/server";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// PATCH /api/boards/[id]/nodes/[nodeId] - Update node position/size
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: boardId, nodeId } = await params;
  const body = await request.json();

  // Verify board ownership
  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board || board.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Update node
  const updateData: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    content?: string;
  } = {};
  if (body.x !== undefined) updateData.x = body.x;
  if (body.y !== undefined) updateData.y = body.y;
  if (body.width !== undefined) updateData.width = body.width;
  if (body.height !== undefined) updateData.height = body.height;
  if (body.content !== undefined) updateData.content = body.content;

  const node = await prisma.node.update({
    where: { id: nodeId },
    data: updateData,
  });

  // Update board's updatedAt timestamp
  await prisma.board.update({
    where: { id: boardId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(node);
}

// DELETE /api/boards/[id]/nodes/[nodeId] - Delete node
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; nodeId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: boardId, nodeId } = await params;

  // Verify board ownership
  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board || board.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get the node to be deleted
  const nodeToDelete = await prisma.node.findUnique({
    where: { id: nodeId },
    include: {
      children: true,
    },
  });

  if (!nodeToDelete) {
    return NextResponse.json({ error: "Node not found" }, { status: 404 });
  }

  // Find the paired node (answer if this is question, question if this is answer)
  let pairedNodeId: string | null = null;

  if (
    nodeToDelete.type === "root_question" ||
    nodeToDelete.type === "followup_question"
  ) {
    // This is a question - find its paired answer by parentId (most reliable)
    const answerType =
      nodeToDelete.type === "root_question" ? "ai_answer" : "followup_answer";
    const pairedAnswer = await prisma.node.findFirst({
      where: {
        boardId,
        parentId: nodeToDelete.id,
        type: answerType,
      },
    });
    pairedNodeId = pairedAnswer?.id || null;
  } else if (
    nodeToDelete.type === "ai_answer" ||
    nodeToDelete.type === "followup_answer"
  ) {
    // This is an answer - its parent is the paired question
    pairedNodeId = nodeToDelete.parentId;
  }

  // Get all children of both the question and answer being deleted
  const questionChildren = nodeToDelete.children;
  const answerChildren = pairedNodeId
    ? await prisma.node.findMany({
        where: { parentId: pairedNodeId },
      })
    : [];

  // Combine all children that need to be promoted
  const allChildren = [...questionChildren, ...answerChildren];

  // Promote children to root nodes and update thread rootIds
  if (allChildren.length > 0) {
    // Find the first follow-up question to promote as the new root
    const firstFollowUp = allChildren.find(
      (child) => child.type === "followup_question"
    );

    if (firstFollowUp) {
      // Get the old rootId before deletion (to update all nodes in the thread)
      const oldRootId = nodeToDelete.rootId || nodeToDelete.id;

      // Promote the first follow-up to root
      await prisma.node.update({
        where: { id: firstFollowUp.id },
        data: {
          type: "root_question",
          rootId: firstFollowUp.id, // New root references itself
          parentId: null,
        },
      });

      // Promote its answer
      await prisma.node.updateMany({
        where: {
          boardId,
          parentId: firstFollowUp.id,
          type: "followup_answer",
        },
        data: {
          type: "ai_answer",
          rootId: firstFollowUp.id,
        },
      });

      // Update ALL nodes in the thread that had the old rootId to point to the new root
      await prisma.node.updateMany({
        where: {
          boardId,
          rootId: oldRootId,
          id: { not: nodeToDelete.id }, // Exclude the node being deleted
        },
        data: {
          rootId: firstFollowUp.id, // Point to new root for color consistency
        },
      });
    }
  }

  // Delete the node and its paired node
  await prisma.node.delete({
    where: { id: nodeId },
  });

  if (pairedNodeId) {
    await prisma.node.delete({
      where: { id: pairedNodeId },
    });
  }

  // Update board's updatedAt timestamp
  await prisma.board.update({
    where: { id: boardId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    success: true,
    deletedIds: pairedNodeId ? [nodeId, pairedNodeId] : [nodeId],
  });
}
