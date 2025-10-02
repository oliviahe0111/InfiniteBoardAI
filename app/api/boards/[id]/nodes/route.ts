import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// POST /api/boards/[id]/nodes - Create a new question node
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: boardId } = await params;
  const { question, x, y } = await request.json();

  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Invalid question" }, { status: 400 });
  }

  // Verify board ownership
  const board = await prisma.board.findUnique({
    where: { id: boardId },
  });

  if (!board || board.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Create new question node
  const node = await prisma.node.create({
    data: {
      boardId,
      type: "root_question",
      content: question,
      x: x || 400,
      y: y || 200,
      width: 320,
      height: 150,
      rootId: null, // This is a root question
    },
  });

  return NextResponse.json(node);
}
