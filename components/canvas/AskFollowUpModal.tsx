"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, X } from "lucide-react";

interface AskFollowUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotedText: string;
  onSubmit: (question: string) => Promise<void>;
}

export function AskFollowUpModal({
  open,
  onOpenChange,
  quotedText,
  onSubmit,
}: AskFollowUpModalProps) {
  const [question, setQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(question);
      setQuestion("");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create follow-up question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#1a2632] border border-gray-200 dark:border-gray-700 rounded-xl p-6 sm:p-8 w-full max-w-lg z-50 shadow-2xl">
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col">
              <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white">
                Ask a follow-up
              </Dialog.Title>
              <Dialog.Description className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Based on the selected text:
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </Dialog.Close>
          </div>

          {/* Quoted Text Section */}
          <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <p className="text-sm text-gray-600 dark:text-gray-400 italic line-clamp-3">
              &ldquo;{quotedText}&rdquo;
            </p>
          </div>

          {/* Follow-up Question Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="follow-up-question" className="sr-only">
                Follow-up question
              </label>
              <textarea
                id="follow-up-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What are the best practices for implementing these tools?"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary/50 focus:border-primary transition resize-none"
                rows={4}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={!question.trim() || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {isSubmitting ? "Submitting..." : "Submit Question"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
