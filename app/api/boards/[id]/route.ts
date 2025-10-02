import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// PATCH /api/boards/[id] - Update board title
export async function PATCH(
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

  const { id } = await params;
  const { title } = await request.json();

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  // Check ownership
  const existingBoard = await prisma.board.findUnique({
    where: { id },
  });

  if (!existingBoard || existingBoard.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const board = await prisma.board.update({
    where: { id },
    data: { title },
  });

  return NextResponse.json(board);
}

// DELETE /api/boards/[id] - Delete board
export async function DELETE(
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

  const { id } = await params;

  // Check ownership
  const existingBoard = await prisma.board.findUnique({
    where: { id },
  });

  if (!existingBoard || existingBoard.ownerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.board.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
