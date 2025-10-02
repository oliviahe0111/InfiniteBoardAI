"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface DeleteBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardTitle: string;
  onDelete: () => Promise<void>;
}

export function DeleteBoardModal({
  open,
  onOpenChange,
  boardTitle,
  onDelete,
}: DeleteBoardModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await onDelete();
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-white/10 rounded-lg p-6 w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold text-white">
              Delete Board
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </Dialog.Close>
          </div>

          <p className="text-gray-300 mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-white">{boardTitle}</span>? This
            action cannot be undone and will delete all nodes in this board.
          </p>

          <div className="flex justify-end gap-3">
            <Dialog.Close asChild>
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete Board"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
