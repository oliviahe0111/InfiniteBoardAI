"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

interface RenameBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTitle: string;
  onRename: (title: string) => Promise<void>;
}

export function RenameBoardModal({
  open,
  onOpenChange,
  currentTitle,
  onRename,
}: RenameBoardModalProps) {
  const [title, setTitle] = useState(currentTitle);
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    setTitle(currentTitle);
  }, [currentTitle, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isRenaming || title === currentTitle) return;

    setIsRenaming(true);
    try {
      await onRename(title);
      onOpenChange(false);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-white/10 rounded-lg p-6 w-full max-w-md shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-xl font-semibold text-white">
              Rename Board
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Board title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />

            <div className="flex justify-end gap-3 mt-6">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!title.trim() || isRenaming || title === currentTitle}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRenaming ? "Renaming..." : "Rename"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
