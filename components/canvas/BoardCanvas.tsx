"use client";

import { useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { CanvasNode } from "./CanvasNode";
import { AskQuestionModal } from "./AskQuestionModal";
import { Plus, Maximize2, FocusIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface Node {
  id: string;
  type: "root_question" | "ai_answer" | "followup_question" | "followup_answer";
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rootId: string | null;
}

interface Board {
  id: string;
  title: string;
  nodes: Node[];
}

interface BoardCanvasProps {
  board: Board;
}

export function BoardCanvas({ board: initialBoard }: BoardCanvasProps) {
  const router = useRouter();
  const [scale, setScale] = useState(1);
  const [board, setBoard] = useState(initialBoard);
  const [askModalOpen, setAskModalOpen] = useState(false);

  const handleAskQuestion = async (question: string) => {
    // Random position to avoid stacking
    const randomX = Math.floor(Math.random() * 600) + 200; // 200-800
    const randomY = Math.floor(Math.random() * 400) + 100; // 100-500

    const res = await fetch(`/api/boards/${board.id}/nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        x: randomX,
        y: randomY,
      }),
    });

    if (res.ok) {
      const newNode = await res.json();
      setBoard({
        ...board,
        nodes: [...board.nodes, newNode],
      });
      router.refresh();
    }
  };

  const handleNodePositionChange = async (
    nodeId: string,
    x: number,
    y: number
  ) => {
    // Optimistic update
    setBoard({
      ...board,
      nodes: board.nodes.map((node) =>
        node.id === nodeId ? { ...node, x, y } : node
      ),
    });

    // Save to database
    await fetch(`/api/boards/${board.id}/nodes/${nodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y }),
    });
  };

  const handleNodeSizeChange = async (
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

    // Save to database
    await fetch(`/api/boards/${board.id}/nodes/${nodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ width, height }),
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-800 z-20 bg-background-light dark:bg-background-dark">
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
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            {board.title}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700"></div>
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
        >
          {({ zoomIn, zoomOut, resetTransform, centerView }) => (
            <>
              {/* Zoom Controls */}
              <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm p-1.5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 z-10">
                <button
                  onClick={() => zoomIn()}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Zoom In"
                >
                  <svg
                    className="w-5 h-5 text-slate-600 dark:text-slate-400"
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
                  onClick={() => zoomOut()}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Zoom Out"
                >
                  <svg
                    className="w-5 h-5 text-slate-600 dark:text-slate-400"
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
                  onClick={() => resetTransform()}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Fit to Content"
                >
                  <Maximize2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => centerView()}
                  className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                  title="Reset View"
                >
                  <FocusIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
                <div className="border-l border-slate-300 dark:border-slate-700 h-6 mx-1"></div>
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 px-2 w-20 text-center">
                  {Math.round(scale * 100)}%
                </span>
              </div>

              {/* Infinite Canvas */}
              <TransformComponent
                wrapperClass="w-full h-full"
                contentClass="w-full h-full"
              >
                <div className="absolute inset-0" id="canvas">
                  {board.nodes.map((node) => (
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
                      onPositionChange={handleNodePositionChange}
                      onSizeChange={handleNodeSizeChange}
                    />
                  ))}
                </div>
              </TransformComponent>
            </>
          )}
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
