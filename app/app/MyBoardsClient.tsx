"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { BoardCard } from "@/components/boards/BoardCard";
import { CreateBoardModal } from "@/components/boards/CreateBoardModal";
import { RenameBoardModal } from "@/components/boards/RenameBoardModal";
import { DeleteBoardModal } from "@/components/boards/DeleteBoardModal";

interface Board {
  id: string;
  title: string;
  updatedAt: Date;
}

interface MyBoardsClientProps {
  initialBoards: Board[];
}

export function MyBoardsClient({ initialBoards }: MyBoardsClientProps) {
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);

  const handleCreate = async (data: {
    title: string;
    firstQuestion: string;
  }) => {
    const res = await fetch("/api/boards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      const newBoard = await res.json();
      setBoards([newBoard, ...boards]);
    }
  };

  const handleRename = async (title: string) => {
    if (!selectedBoard) return;

    const res = await fetch(`/api/boards/${selectedBoard.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (res.ok) {
      const updated = await res.json();
      setBoards(boards.map((b) => (b.id === selectedBoard.id ? updated : b)));
    }
  };

  const handleDelete = async () => {
    if (!selectedBoard) return;

    const res = await fetch(`/api/boards/${selectedBoard.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setBoards(boards.filter((b) => b.id !== selectedBoard.id));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">My Boards</h1>
          <p className="text-gray-400 mt-1">
            {boards.length} {boards.length === 1 ? "board" : "boards"}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-full transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="bg-white/5 rounded-lg border border-white/10 p-12 text-center">
          <p className="text-gray-400 mb-4">
            You haven&apos;t created any boards yet.
          </p>
          <button
            onClick={() => setCreateOpen(true)}
            className="text-primary hover:underline font-semibold"
          >
            Create your first board
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              id={board.id}
              title={board.title}
              updatedAt={board.updatedAt}
              onRename={() => {
                setSelectedBoard(board);
                setRenameOpen(true);
              }}
              onDelete={() => {
                setSelectedBoard(board);
                setDeleteOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <CreateBoardModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      <RenameBoardModal
        open={renameOpen}
        onOpenChange={setRenameOpen}
        currentTitle={selectedBoard?.title || ""}
        onRename={handleRename}
      />

      <DeleteBoardModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        boardTitle={selectedBoard?.title || ""}
        onDelete={handleDelete}
      />
    </>
  );
}
