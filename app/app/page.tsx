import { createClient } from "@/lib/supabase/server";

import { redirect } from "next/navigation";
import { SignOutButton } from "./SignOutButton";
import { MyBoardsClient } from "./MyBoardsClient";
import { UserAvatar } from "./UserAvatar";

import { prisma } from "@/lib/prisma";

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
        <div className="flex items-center gap-3 justify-end mb-4">
          <UserAvatar user={user} />
          <SignOutButton />
        </div>
        <MyBoardsClient initialBoards={boards} />
      </div>
    </div>
  );
}
