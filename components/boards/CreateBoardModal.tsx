"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus } from "lucide-react";

interface CreateBoardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { title: string; firstQuestion: string }) => Promise<void>;
}

export function CreateBoardModal({
  open,
  onOpenChange,
  onCreate,
}: CreateBoardModalProps) {
  const [title, setTitle] = useState("");
  const [firstQuestion, setFirstQuestion] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !firstQuestion.trim() || isCreating) return;

    setIsCreating(true);
    try {
      await onCreate({ title, firstQuestion });
      setTitle("");
      setFirstQuestion("");
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-850 border border-white/10 rounded-xl p-8 w-full max-w-lg shadow-2xl">
          <div className="flex items-start justify-between mb-2">
            <div>
              <Dialog.Title className="text-2xl font-bold text-white">
                Create a New Board
              </Dialog.Title>
              <p className="mt-1 text-sm text-slate-400">
                Start a new brainstorming session with an initial question.
              </p>
            </div>
            <Dialog.Close asChild>
              <button className="p-1 rounded hover:bg-white/10 transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <div>
              <label
                htmlFor="board-name"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Board Name
              </label>
              <input
                id="board-name"
                type="text"
                placeholder="e.g., Marketing Strategy Q3"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="first-question"
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Your First Question
              </label>
              <textarea
                id="first-question"
                placeholder="Type your first question..."
                value={firstQuestion}
                onChange={(e) => setFirstQuestion(e.target.value)}
                rows={4}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end gap-4 pt-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="h-10 px-5 rounded-lg border border-slate-700 text-sm font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!title.trim() || !firstQuestion.trim() || isCreating}
                className="flex h-10 items-center justify-center gap-2 px-5 rounded-lg bg-primary text-sm font-bold text-white shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {isCreating ? "Creating..." : "Create Board"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
