import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

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

  // Delete node (cascade will delete children)
  await prisma.node.delete({
    where: { id: nodeId },
  });

  return NextResponse.json({ success: true });
}
