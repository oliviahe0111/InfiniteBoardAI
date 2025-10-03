"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { MessageCircle, Sparkles, X } from "lucide-react";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { AskFollowUpModal } from "./AskFollowUpModal";
import ReactMarkdown from "react-markdown";

interface Node {
  id: string;
  type: "root_question" | "ai_answer" | "followup_question" | "followup_answer";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rootId: string | null;
  parentId: string | null;
}

interface CanvasNodeProps {
  id: string;
  type: "root_question" | "ai_answer" | "followup_question" | "followup_answer";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rootId: string | null;
  boardId: string;
  allNodes: Node[];
  onPositionChange?: (id: string, x: number, y: number) => void;
  onSizeChange?: (id: string, width: number, height: number) => void;
  onDelete?: (id: string) => void;
  onClick?: () => void;
  onAskFollowUp?: (
    question: string,
    quotedText: string,
    parentNodeId: string,
    rootNodeId: string
  ) => Promise<void>;
}

// Color palette for different root questions (green removed - conflicts with AI response background)
const rootQuestionColors = [
  {
    bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
    border: "border-blue-200",
    iconColor: "text-blue-600",
    accent: "blue",
  },
  {
    bg: "bg-gradient-to-br from-purple-50 to-pink-50",
    border: "border-purple-200",
    iconColor: "text-purple-600",
    accent: "purple",
  },
  {
    bg: "bg-gradient-to-br from-amber-50 to-orange-50",
    border: "border-amber-200",
    iconColor: "text-amber-600",
    accent: "amber",
  },
  {
    bg: "bg-gradient-to-br from-rose-50 to-pink-50",
    border: "border-rose-200",
    iconColor: "text-rose-600",
    accent: "rose",
  },
  {
    bg: "bg-gradient-to-br from-cyan-50 to-blue-50",
    border: "border-cyan-200",
    iconColor: "text-cyan-600",
    accent: "cyan",
  },
];

// Get color based on rootId hash
const getThreadColor = (rootId: string | null, nodeId: string) => {
  const hashSource = rootId || nodeId;
  const hash = hashSource
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = hash % rootQuestionColors.length;
  return rootQuestionColors[colorIndex];
};

export function CanvasNode({
  id,
  type,
  content,
  x: initialX,
  y: initialY,
  width: initialWidth,
  height: initialHeight,
  rootId,
  allNodes,
  onPositionChange,
  onSizeChange,
  onDelete,
  onClick,
  onAskFollowUp,
}: CanvasNodeProps) {
  const colors = getThreadColor(rootId, id);
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [showAskButton, setShowAskButton] = useState(false);
  const [askButtonPosition, setAskButtonPosition] = useState({ x: 0, y: 0 });
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({
    width: initialWidth,
    height: initialHeight,
  });
  const dragStartPos = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  const resizeStartPos = useRef({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    nodeX: 0,
    nodeY: 0,
  });
  const resizeHandle = useRef<string | null>(null);

  // Find matching AI answer for this question
  const aiAnswer = useMemo(() => {
    if (type === "root_question" || type === "followup_question") {
      // For root questions, look for ai_answer with matching rootId
      // For follow-up questions, look for followup_answer with matching rootId
      const answerType =
        type === "root_question" ? "ai_answer" : "followup_answer";

      // First try to find by parentId (most reliable)
      let answer = allNodes.find(
        (n) => n.id !== id && n.parentId === id && n.type === answerType
      );

      // Fallback: find by rootId matching
      if (!answer) {
        answer = allNodes.find(
          (n) =>
            n.id !== id && n.rootId === (rootId || id) && n.type === answerType
        );
      }

      return answer?.content || null;
    }
    return null;
  }, [type, id, rootId, allNodes]);

  // Drag and resize effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStartPos.current.x;
        const deltaY = e.clientY - dragStartPos.current.y;

        const newX = dragStartPos.current.nodeX + deltaX;
        const newY = dragStartPos.current.nodeY + deltaY;

        setPosition({ x: newX, y: newY });
      }

      if (isResizing && resizeHandle.current) {
        const deltaX = e.clientX - resizeStartPos.current.x;
        const deltaY = e.clientY - resizeStartPos.current.y;

        let newWidth = resizeStartPos.current.width;
        let newHeight = resizeStartPos.current.height;
        let newX = resizeStartPos.current.nodeX;
        let newY = resizeStartPos.current.nodeY;

        const handle = resizeHandle.current;

        // Calculate new dimensions based on which handle is being dragged
        if (handle.includes("right")) {
          newWidth = Math.max(400, resizeStartPos.current.width + deltaX);
        }
        if (handle.includes("left")) {
          const proposedWidth = resizeStartPos.current.width - deltaX;
          if (proposedWidth >= 400) {
            newWidth = proposedWidth;
            newX = resizeStartPos.current.nodeX + deltaX;
          }
        }
        if (handle.includes("bottom")) {
          newHeight = Math.max(350, resizeStartPos.current.height + deltaY);
        }
        if (handle.includes("top")) {
          const proposedHeight = resizeStartPos.current.height - deltaY;
          if (proposedHeight >= 350) {
            newHeight = proposedHeight;
            newY = resizeStartPos.current.nodeY + deltaY;
          }
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        if (
          onPositionChange &&
          (position.x !== initialX || position.y !== initialY)
        ) {
          onPositionChange(id, position.x, position.y);
        }
      }

      if (isResizing) {
        setIsResizing(false);
        resizeHandle.current = null;
        if (
          onSizeChange &&
          (size.width !== initialWidth || size.height !== initialHeight)
        ) {
          onSizeChange(id, size.width, size.height);
        }
        if (
          onPositionChange &&
          (position.x !== initialX || position.y !== initialY)
        ) {
          onPositionChange(id, position.x, position.y);
        }
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    position,
    size,
    onPositionChange,
    onSizeChange,
    id,
    initialX,
    initialY,
    initialWidth,
    initialHeight,
  ]);

  // Click outside to deselect
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        nodeRef.current &&
        !nodeRef.current.contains(e.target as HTMLElement)
      ) {
        setIsSelected(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Don't render standalone AI answers - they're shown inline with their question
  if (type === "ai_answer" || type === "followup_answer") {
    return null;
  }

  // Handle card selection
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSelected(true);
    onClick?.();
  };

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Don't drag when clicking resize handles or buttons
    if (
      target.classList.contains("resize-handle") ||
      target.closest("button") ||
      target.closest(".no-drag")
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      nodeX: position.x,
      nodeY: position.y,
    };
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeHandle.current = handle;
    resizeStartPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      nodeX: position.x,
      nodeY: position.y,
    };
  };

  // Handle delete - open modal for confirmation
  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.(id);
  };

  // Handle text selection for follow-up questions
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);

      // Get selection position
      const range = selection?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();

      if (rect) {
        setAskButtonPosition({
          x: rect.left + rect.width / 2,
          y: rect.bottom + 5,
        });
        setShowAskButton(true);
      }
    } else {
      setShowAskButton(false);
    }
  };

  const handleAskFollowUpClick = () => {
    setShowAskButton(false);
    setShowFollowUpModal(true);
  };

  const handleFollowUpSubmit = async (question: string) => {
    if (onAskFollowUp && aiAnswer) {
      // Find the answer node ID
      const answerType =
        type === "root_question" ? "ai_answer" : "followup_answer";
      const answerNode = allNodes.find(
        (n) =>
          n.id !== id && n.rootId === (rootId || id) && n.type === answerType
      );

      if (answerNode) {
        await onAskFollowUp(
          question,
          selectedText,
          answerNode.id, // parentId is the answer node
          rootId || id // rootId
        );
      }
    }
  };

  const Icon = MessageCircle;

  return (
    <motion.div
      className="absolute"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      data-node-id={id}
    >
      <div
        ref={nodeRef}
        className={`
          ${isDragging ? "cursor-grabbing shadow-2xl scale-105" : "cursor-grab"}
          ${colors.bg} ${colors.border} border-2 shadow-lg hover:shadow-xl
          transition-all duration-300 rounded-xl overflow-hidden relative
        `}
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          minHeight: "150px",
          minWidth: "280px",
          zIndex: isSelected ? 20 : 10,
        }}
        onMouseDown={handleMouseDown}
        onClick={handleCardClick}
      >
        {/* Card Content */}
        <div className="p-4 h-full flex flex-col overflow-auto">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3 flex-shrink-0">
            <div
              className={`p-2 rounded-full ${colors.bg} ${colors.border} border flex-shrink-0`}
            >
              <Icon className={`w-4 h-4 ${colors.iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {type === "root_question"
                    ? "Root Question"
                    : "Follow-up Question"}
                </p>
                {onDelete && (
                  <button
                    className="no-drag h-auto p-1 hover:bg-red-100 text-gray-500 hover:text-red-600 rounded transition-colors"
                    onClick={handleDeleteClick}
                    onMouseDown={(e) => e.stopPropagation()}
                    title="Delete question"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="flex-shrink-0 mb-3">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Question:
            </h3>
            <div className="text-sm leading-relaxed text-gray-800 whitespace-pre-line">
              {content}
            </div>
          </div>

          {/* AI Response Section */}
          {aiAnswer && (
            <div className="border-t pt-4 mb-3 no-drag">
              <button
                className="w-full text-sm font-medium text-green-700 mb-2 flex items-center justify-between hover:bg-green-50/50 rounded p-1 -m-1 transition-colors text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-1" />
                  AI Response:
                  {!isExpanded && (
                    <span className="ml-2 text-xs font-normal text-green-600">
                      (expand to view)
                    </span>
                  )}
                </div>
                <span className="text-green-600 text-2xl leading-none">
                  {isExpanded ? "▴" : "▾"}
                </span>
              </button>
              {isExpanded && (
                <div
                  className="text-sm leading-relaxed text-gray-800 bg-green-50 p-3 rounded-lg border border-green-200 prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-ul:text-gray-800 prose-ol:text-gray-800 prose-li:text-gray-800 relative select-text cursor-text"
                  onMouseUp={handleTextSelection}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <ReactMarkdown>{aiAnswer}</ReactMarkdown>
                </div>
              )}

              {/* Ask AI About This Button - Portal */}
              {showAskButton &&
                onAskFollowUp &&
                typeof window !== "undefined" &&
                createPortal(
                  <button
                    style={{
                      position: "fixed",
                      left: `${askButtonPosition.x}px`,
                      top: `${askButtonPosition.y}px`,
                      transform: "translateX(-50%)",
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-lg z-50 whitespace-nowrap flex items-center gap-1 pointer-events-auto"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAskFollowUpClick();
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    data-selection-ui="true"
                  >
                    <Sparkles className="w-3 h-3" />
                    Ask AI about this
                  </button>,
                  document.body
                )}
            </div>
          )}
        </div>

        {/* Resize Handles (visible when selected) */}
        {isSelected && (
          <>
            {/* Top-left */}
            <div
              className="resize-handle absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, "top-left")}
            />
            {/* Top-right */}
            <div
              className="resize-handle absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, "top-right")}
            />
            {/* Bottom-left */}
            <div
              className="resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, "bottom-left")}
            />
            {/* Bottom-right */}
            <div
              className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize hover:scale-125 transition-transform"
              onMouseDown={(e) => handleResizeStart(e, "bottom-right")}
            />
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleConfirmDelete}
        nodeType={type}
      />

      {/* Ask Follow-Up Modal */}
      <AskFollowUpModal
        open={showFollowUpModal}
        onOpenChange={setShowFollowUpModal}
        quotedText={selectedText}
        onSubmit={handleFollowUpSubmit}
      />
    </motion.div>
  );
}
