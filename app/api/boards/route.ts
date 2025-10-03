import { createClient } from "@/lib/supabase/server";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// GET /api/boards - List all boards for the authenticated user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boards = await prisma.board.findMany({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return NextResponse.json(boards);
}

// POST /api/boards - Create a new board
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, firstQuestion } = await request.json();

  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Invalid title" }, { status: 400 });
  }

  if (!firstQuestion || typeof firstQuestion !== "string") {
    return NextResponse.json(
      { error: "Invalid first question" },
      { status: 400 }
    );
  }

  const board = await prisma.board.create({
    data: {
      title,
      ownerId: user.id,
    },
  });

  // Create the initial question node
  await prisma.node.create({
    data: {
      boardId: board.id,
      type: "root_question",
      content: firstQuestion,
      x: 400,
      y: 200,
      width: 320,
      height: 150,
      rootId: null,
    },
  });

  return NextResponse.json(board);
}
