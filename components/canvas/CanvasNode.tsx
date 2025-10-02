"use client";

import { useState, useRef, useEffect } from "react";

interface CanvasNodeProps {
  id: string;
  type: "root_question" | "ai_answer" | "followup_question" | "followup_answer";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rootId: string | null;
  onPositionChange?: (id: string, x: number, y: number) => void;
  onSizeChange?: (id: string, width: number, height: number) => void;
  onClick?: () => void;
}

// Color themes based on rootId hash
const getThreadColor = (rootId: string | null) => {
  if (!rootId) {
    // First question in a thread (sky blue)
    return {
      bg: "bg-[#e0f2fe] dark:bg-sky-900/70",
      border: "border-sky-200/50 dark:border-sky-800/50",
      textTitle: "text-sky-900 dark:text-sky-100",
      textContent: "text-slate-700 dark:text-slate-300",
    };
  }

  // Hash rootId to determine color (alternating between sky and purple)
  const hash = rootId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % 2;

  if (colorIndex === 0) {
    return {
      bg: "bg-[#e0f2fe] dark:bg-sky-900/70",
      border: "border-sky-200/50 dark:border-sky-800/50",
      textTitle: "text-sky-900 dark:text-sky-100",
      textContent: "text-slate-700 dark:text-slate-300",
    };
  } else {
    return {
      bg: "bg-[#f3e8ff] dark:bg-purple-900/70",
      border: "border-purple-200/50 dark:border-purple-800/50",
      textTitle: "text-purple-900 dark:text-purple-100",
      textContent: "text-slate-700 dark:text-slate-300",
    };
  }
};

export function CanvasNode({
  id,
  content,
  x: initialX,
  y: initialY,
  width: initialWidth,
  height: initialHeight,
  rootId,
  onPositionChange,
  onSizeChange,
  onClick,
}: CanvasNodeProps) {
  const colors = getThreadColor(rootId);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({
    width: initialWidth,
    height: initialHeight,
  });
  const dragStartPos = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains("resize-handle")) {
      return; // Don't drag when resizing
    }

    e.preventDefault();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      nodeX: position.x,
      nodeY: position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;

      const newX = dragStartPos.current.nodeX + deltaX;
      const newY = dragStartPos.current.nodeY + deltaY;

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        // Save position after dragging
        if (
          onPositionChange &&
          (position.x !== initialX || position.y !== initialY)
        ) {
          onPositionChange(id, position.x, position.y);
        }
      }
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, position, onPositionChange, id, initialX, initialY]);

  // Handle resizing with ResizeObserver
  useEffect(() => {
    if (!nodeRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = Math.round(entry.contentRect.width);
        const newHeight = Math.round(entry.contentRect.height);

        if (newWidth !== size.width || newHeight !== size.height) {
          setSize({ width: newWidth, height: newHeight });
          if (onSizeChange) {
            onSizeChange(id, newWidth, newHeight);
          }
        }
      }
    });

    resizeObserver.observe(nodeRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [id, onSizeChange, size.width, size.height]);

  return (
    <div
      ref={nodeRef}
      className={`absolute cursor-grab active:cursor-grabbing p-5 rounded-xl shadow-2xl resize overflow-auto backdrop-blur-sm ${colors.bg} ${colors.border} border`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height === 0 ? "auto" : size.height,
        minHeight: 150,
        minWidth: 280,
      }}
      onMouseDown={handleMouseDown}
      onClick={onClick}
    >
      <p className={`text-sm ${colors.textContent} whitespace-pre-line`}>
        <span className={`font-bold text-base ${colors.textTitle}`}>
          {content.split("\n\n")[0]}
        </span>
        {content.includes("\n\n") && (
          <>
            <br />
            <br />
            {content.split("\n\n").slice(1).join("\n\n")}
          </>
        )}
      </p>
    </div>
  );
}
