import { createClient } from "@/lib/supabase/server";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { SignOutButton } from "./SignOutButton";
import { MyBoardsClient } from "./MyBoardsClient";

const prisma = new PrismaClient();

export default async function MyBoardsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const boards = await prisma.board.findMany({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-background-dark text-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-end mb-4">
          <SignOutButton />
        </div>
        <MyBoardsClient initialBoards={boards} />
      </div>
    </div>
  );
}
