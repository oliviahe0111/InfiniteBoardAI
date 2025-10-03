"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  nodeType:
    | "root_question"
    | "ai_answer"
    | "followup_question"
    | "followup_answer";
}

export function DeleteConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  nodeType,
}: DeleteConfirmModalProps) {
  const getDeleteMessage = () => {
    if (nodeType === "root_question") {
      return {
        title: "Delete Root Question?",
        description:
          "This will permanently delete this question and its AI response. Any follow-up questions will become independent root questions.",
        warning: "This action cannot be undone.",
      };
    } else if (nodeType === "followup_question") {
      return {
        title: "Delete Follow-up Question?",
        description:
          "This will permanently delete this follow-up question and its AI response. Any nested follow-ups will become root questions.",
        warning: "This action cannot be undone.",
      };
    }
    return {
      title: "Delete this item?",
      description: "This item will be permanently deleted.",
      warning: "This action cannot be undone.",
    };
  };

  const message = getDeleteMessage();

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 w-full max-w-md z-50 shadow-2xl animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {message.title}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {message.description}
              </Dialog.Description>
              <p className="text-sm font-medium text-red-600 dark:text-red-500">
                {message.warning}
              </p>
            </div>
            <Dialog.Close asChild>
              <button className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Dialog.Close asChild>
              <button className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Cancel
              </button>
            </Dialog.Close>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-lg transition-colors"
            >
              Delete Question
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
