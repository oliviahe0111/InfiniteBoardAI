"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { CanvasNode } from "./CanvasNode";
import { AskQuestionModal } from "./AskQuestionModal";
import { UserAvatar } from "@/app/app/UserAvatar";
import { Plus, Maximize2, FocusIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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

interface Board {
  id: string;
  title: string;
  nodes: Node[];
}

interface BoardCanvasProps {
  board: Board;
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
    };
  };
}

export function BoardCanvas({ board: initialBoard, user }: BoardCanvasProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [scale, setScale] = useState(1);
  const [board, setBoard] = useState(initialBoard);
  const [askModalOpen, setAskModalOpen] = useState(false);
  const hasCreatedInitialQuestion = useRef(false);

  // Debounce refs for autosave
  const saveTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Memoize nodes to prevent unnecessary re-renders
  const memoizedNodes = useMemo(() => board.nodes, [board.nodes]);

  // Debug: Log initial board data
  console.log(
    `[BoardCanvas] Rendering with ${memoizedNodes.length} nodes:`,
    memoizedNodes
  );

  // Handle initial question from query parameter
  useEffect(() => {
    const firstQuestion = searchParams.get("q");
    if (
      firstQuestion &&
      board.nodes.length === 0 &&
      !hasCreatedInitialQuestion.current
    ) {
      hasCreatedInitialQuestion.current = true;
      handleAskQuestion(firstQuestion);
      // Remove query parameter from URL
      router.replace(`/app/boards/${board.id}`);
    }
  }, [searchParams, board.nodes.length, board.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAskQuestion = async (question: string) => {
    // Random position to avoid stacking
    const randomX = Math.floor(Math.random() * 600) + 200; // 200-800
    const randomY = Math.floor(Math.random() * 400) + 100; // 100-500

    const res = await fetch(`/api/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: board.id,
        rootId: null,
        parentId: null,
        question,
        position: { x: randomX, y: randomY },
      }),
    });

    if (res.ok) {
      const { question: questionNode, answer: answerNode } = await res.json();
      setBoard({
        ...board,
        nodes: [...board.nodes, questionNode, answerNode],
      });
      router.refresh();
    }
  };

  const handleAskFollowUp = async (
    question: string,
    quotedText: string,
    parentNodeId: string,
    rootNodeId: string
  ) => {
    // Find the root question to position follow-up nearby
    const rootNode = board.nodes.find((n) => n.id === rootNodeId);

    if (!rootNode) {
      console.error("Root node not found");
      return;
    }

    // Position near root question with some offset
    const offsetX = 100 + Math.floor(Math.random() * 50); // 100-150px offset
    const offsetY = 150 + Math.floor(Math.random() * 50); // 150-200px offset

    const res = await fetch(`/api/ai/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        boardId: board.id,
        rootId: rootNodeId,
        parentId: parentNodeId,
        question,
        quotedText,
        position: { x: rootNode.x + offsetX, y: rootNode.y + offsetY },
      }),
    });

    if (res.ok) {
      const { question: questionNode, answer: answerNode } = await res.json();
      setBoard({
        ...board,
        nodes: [...board.nodes, questionNode, answerNode],
      });
      router.refresh();
    }
  };

  const handleNodePositionChange = (nodeId: string, x: number, y: number) => {
    // Optimistic update
    setBoard({
      ...board,
      nodes: board.nodes.map((node) =>
        node.id === nodeId ? { ...node, x, y } : node
      ),
    });

    // Debounced save to database
    if (saveTimeoutRef.current[nodeId]) {
      clearTimeout(saveTimeoutRef.current[nodeId]);
    }

    saveTimeoutRef.current[nodeId] = setTimeout(() => {
      fetch(`/api/boards/${board.id}/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ x, y }),
      });
    }, 500); // 500ms debounce
  };

  const handleNodeSizeChange = (
    nodeId: string,
    width: number,
    height: number
  ) => {
    // Optimistic update
    setBoard({
      ...board,
      nodes: board.nodes.map((node) =>
        node.id === nodeId ? { ...node, width, height } : node
      ),
    });

    // Debounced save to database
    if (saveTimeoutRef.current[nodeId]) {
      clearTimeout(saveTimeoutRef.current[nodeId]);
    }

    saveTimeoutRef.current[nodeId] = setTimeout(() => {
      fetch(`/api/boards/${board.id}/nodes/${nodeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ width, height }),
      });
    }, 500); // 500ms debounce
  };

  const handleDeleteNode = async (nodeId: string) => {
    // Delete from database first to get deletedIds
    const res = await fetch(`/api/boards/${board.id}/nodes/${nodeId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      const { deletedIds } = await res.json();

      // Remove both the question and answer nodes from state
      setBoard({
        ...board,
        nodes: board.nodes.filter((node) => !deletedIds.includes(node.id)),
      });
    } else {
      // Show error if deletion failed
      console.error("Failed to delete node");
      alert("Failed to delete the question. Please try again.");
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 z-20 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/app")}
            className="w-8 h-8 text-primary"
          >
            <svg
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900">{board.title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <UserAvatar user={user} />
        </div>
      </header>

      {/* Canvas */}
      <main className="flex-1 relative overflow-hidden">
        {/* Ask a New Question Button */}
        <div className="absolute top-4 right-6 z-10">
          <button
            onClick={() => setAskModalOpen(true)}
            className="bg-primary text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Ask a New Question
          </button>
        </div>

        <TransformWrapper
          initialScale={1}
          minScale={0.1}
          maxScale={4}
          centerOnInit
          limitToBounds={false}
          onZoom={(ref) => setScale(ref.state.scale)}
          onTransformed={(ref) => setScale(ref.state.scale)}
          panning={{ disabled: false, velocityDisabled: true }}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: true }}
        >
          {({ resetTransform, centerView, setTransform, instance }) => {
            const handleZoomIn = () => {
              const currentState = instance.transformState;
              const currentScale = currentState.scale;
              const newScale = Math.min(currentScale + 0.1, 4);

              // Calculate viewport center
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight - 64; // Subtract header

              // Calculate center point in canvas coordinates (before zoom)
              const canvasCenterX =
                (viewportWidth / 2 - currentState.positionX) / currentScale;
              const canvasCenterY =
                (viewportHeight / 2 - currentState.positionY) / currentScale;

              // Calculate new position to keep center point fixed
              const newX = viewportWidth / 2 - canvasCenterX * newScale;
              const newY = viewportHeight / 2 - canvasCenterY * newScale;

              setTransform(newX, newY, newScale, 200);
            };

            const handleZoomOut = () => {
              const currentState = instance.transformState;
              const currentScale = currentState.scale;
              const newScale = Math.max(currentScale - 0.1, 0.1);

              // Calculate viewport center
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight - 64; // Subtract header

              // Calculate center point in canvas coordinates (before zoom)
              const canvasCenterX =
                (viewportWidth / 2 - currentState.positionX) / currentScale;
              const canvasCenterY =
                (viewportHeight / 2 - currentState.positionY) / currentScale;

              // Calculate new position to keep center point fixed
              const newX = viewportWidth / 2 - canvasCenterX * newScale;
              const newY = viewportHeight / 2 - canvasCenterY * newScale;

              setTransform(newX, newY, newScale, 200);
            };

            const fitToContent = () => {
              if (memoizedNodes.length === 0) {
                centerView();
                return;
              }

              // Calculate bounding box of all nodes
              let minX = Infinity,
                minY = Infinity;
              let maxX = -Infinity,
                maxY = -Infinity;

              memoizedNodes.forEach((node) => {
                minX = Math.min(minX, node.x);
                minY = Math.min(minY, node.y);
                maxX = Math.max(maxX, node.x + node.width);
                maxY = Math.max(maxY, node.y + node.height);
              });

              const contentWidth = maxX - minX;
              const contentHeight = maxY - minY;
              const centerX = minX + contentWidth / 2;
              const centerY = minY + contentHeight / 2;

              // Calculate zoom to fit with padding
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight - 64; // Subtract header
              const padding = 100;

              const scaleX = (viewportWidth - padding * 2) / contentWidth;
              const scaleY = (viewportHeight - padding * 2) / contentHeight;
              const newScale = Math.min(Math.max(scaleX, scaleY, 0.1), 4);

              // Center on content
              setTransform(
                viewportWidth / 2 - centerX * newScale,
                viewportHeight / 2 - centerY * newScale,
                newScale
              );
            };

            return (
              <>
                {/* Zoom Controls */}
                <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={handleZoomIn}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Zoom In"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Zoom Out"
                  >
                    <svg
                      className="w-5 h-5 text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={fitToContent}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Fit to Content"
                  >
                    <Maximize2 className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={() => resetTransform()}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Reset View"
                  >
                    <FocusIcon className="w-5 h-5 text-gray-700" />
                  </button>
                  <div className="border-l border-gray-300 h-6 mx-1"></div>
                  <span className="text-sm font-semibold text-gray-700 px-2 w-20 text-center">
                    {Math.round(scale * 100)}%
                  </span>
                </div>

                {/* Infinite Canvas */}
                <TransformComponent
                  wrapperClass="w-full h-full"
                  contentClass="w-full h-full"
                >
                  <div
                    className="relative"
                    style={{ width: "5000px", height: "5000px" }}
                    id="canvas"
                  >
                    {memoizedNodes.map((node) => (
                      <CanvasNode
                        key={node.id}
                        id={node.id}
                        type={node.type}
                        content={node.content}
                        x={node.x}
                        y={node.y}
                        width={node.width}
                        height={node.height}
                        rootId={node.rootId}
                        boardId={board.id}
                        allNodes={memoizedNodes}
                        onPositionChange={handleNodePositionChange}
                        onSizeChange={handleNodeSizeChange}
                        onDelete={handleDeleteNode}
                        onAskFollowUp={handleAskFollowUp}
                      />
                    ))}
                  </div>
                </TransformComponent>
              </>
            );
          }}
        </TransformWrapper>
      </main>

      <AskQuestionModal
        open={askModalOpen}
        onOpenChange={setAskModalOpen}
        onSubmit={handleAskQuestion}
      />
    </div>
  );
}
