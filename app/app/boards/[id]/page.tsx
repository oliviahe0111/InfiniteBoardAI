import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { BoardCanvas } from "@/components/canvas/BoardCanvas";

const prisma = new PrismaClient();

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
      nodes: true,
    },
  });

  if (!board || board.ownerId !== user.id) {
    redirect("/app");
  }

  return (
    <div className="h-screen w-screen bg-background-dark">
      <BoardCanvas board={board} />
    </div>
  );
}
