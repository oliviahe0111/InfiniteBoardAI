"use client";

import Link from "next/link";
import { MoreVertical } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface BoardCardProps {
  id: string;
  title: string;
  updatedAt: Date;
  onRename: () => void;
  onDelete: () => void;
}

export function BoardCard({
  id,
  title,
  updatedAt,
  onRename,
  onDelete,
}: BoardCardProps) {
  const formattedDate = new Date(updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="group relative bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 p-6 transition-colors">
      <Link href={`/app/boards/${id}`} className="block">
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400">Updated {formattedDate}</p>
      </Link>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[160px] bg-gray-900 border border-white/10 rounded-lg p-1 shadow-lg"
            sideOffset={5}
          >
            <DropdownMenu.Item
              className="px-3 py-2 text-sm text-white hover:bg-white/10 rounded cursor-pointer outline-none"
              onSelect={onRename}
            >
              Rename
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded cursor-pointer outline-none"
              onSelect={onDelete}
            >
              Delete
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
