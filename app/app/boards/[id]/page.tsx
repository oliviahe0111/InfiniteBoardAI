import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BoardCanvas } from "@/components/canvas/BoardCanvas";

interface BoardPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  // Fetch board and verify ownership
  const board = await prisma.board.findUnique({
    where: { id },
    include: {
      nodes: {
        orderBy: { createdAt: "asc" }, // Oldest first for DOM z-index
      },
    },
  });

  if (!board || board.ownerId !== user.id) {
    redirect("/app");
  }

  // Debug: Log node count
  console.log(
    `[BoardPage] Loading board "${board.title}" with ${board.nodes.length} nodes`
  );
  board.nodes.forEach((node) => {
    console.log(
      `[Node] ${node.type}: "${node.content.substring(0, 50)}..." at (${node.x}, ${node.y})`
    );
  });

  // Convert to plain JSON to avoid Next.js serialization issues
  const serializedBoard = {
    id: board.id,
    title: board.title,
    nodes: board.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      content: node.content,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      rootId: node.rootId,
      parentId: node.parentId,
    })),
  };

  // Serialize user data
  const serializedUser = {
    id: user.id,
    email: user.email,
    user_metadata: user.user_metadata,
  };

  return (
    <div className="h-screen w-screen bg-gray-50">
      <BoardCanvas board={serializedBoard} user={serializedUser} />
    </div>
  );
}
