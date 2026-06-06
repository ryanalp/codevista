"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as TerminalIcon, X, Minus } from "lucide-react";

export interface LogLine {
  id: string;
  type: "cmd" | "out" | "err" | "info";
  text: string;
}

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
  executionOutput?: string | null;
  executionError?: string | null;
  frameCount?: number;
  isRunning?: boolean;
}

const welcomeLogs: LogLine[] = [
  {
    id: "welcome-1",
    type: "info",
    text: "● CodeVista Terminal v0.1.0 — WASM Python runtime",
  },
  {
    id: "welcome-2",
    type: "info",
    text: "● Run your code with Visualize Code to see print output here.",
  },
];

const STORAGE_KEY = "codevista-terminal-height";
const MIN_HEIGHT = 120;
const MAX_HEIGHT_RATIO = 0.75;
const DEFAULT_HEIGHT = 280;

function getInitialHeight(): number {
  if (typeof window === "undefined") return DEFAULT_HEIGHT;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = parseInt(stored, 10);
    if (!Number.isNaN(parsed)) {
      return Math.min(
        window.innerHeight * MAX_HEIGHT_RATIO,
        Math.max(MIN_HEIGHT, parsed),
      );
    }
  }
  return window.innerWidth < 768
    ? Math.round(window.innerHeight * 0.4)
    : DEFAULT_HEIGHT;
}

function clampHeight(value: number): number {
  const max = window.innerHeight * MAX_HEIGHT_RATIO;
  return Math.min(max, Math.max(MIN_HEIGHT, value));
}

export function Terminal({
  isOpen,
  onClose,
  executionOutput,
  executionError,
  frameCount = 0,
  isRunning = false,
}: TerminalProps) {
  const [logs, setLogs] = useState<LogLine[]>(welcomeLogs);
  const [input, setInput] = useState("");
  const [height, setHeight] = useState(getInitialHeight);
  const [isResizing, setIsResizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastExecutionRef = useRef<string | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ y: 0, height: DEFAULT_HEIGHT });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(height));
  }, [height]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const clientY =
        "touches" in e ? e.touches[0].clientY : e.clientY;
      const delta = dragStartRef.current.y - clientY;
      setHeight(clampHeight(dragStartRef.current.height + delta));
    };

    const onEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  const handleResizeStart = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsResizing(true);
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { y: clientY, height };
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (isRunning) {
      setLogs((prev) => [
        ...prev,
        {
          id: `run-${Date.now()}`,
          type: "out",
          text: ">>> Executing trace...",
        },
      ]);
      lastExecutionRef.current = null;
    }
  }, [isRunning]);

  useEffect(() => {
    if (executionError) {
      setLogs((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: "err",
          text: executionError,
        },
        {
          id: `err-exit-${Date.now()}`,
          type: "info",
          text: "● Process exited with code 1",
        },
      ]);
      lastExecutionRef.current = executionError;
      return;
    }

    if (executionOutput === undefined || executionOutput === null) return;

    const signature = `${frameCount}:${executionOutput}`;
    if (lastExecutionRef.current === signature) return;
    lastExecutionRef.current = signature;

    const newLogs: LogLine[] = [
      {
        id: `frames-${Date.now()}`,
        type: "out",
        text: `>>> ${frameCount} frame${frameCount === 1 ? "" : "s"} captured`,
      },
    ];

    if (executionOutput.trim()) {
      executionOutput.split("\n").forEach((line, index) => {
        newLogs.push({
          id: `stdout-${Date.now()}-${index}`,
          type: "out",
          text: line || " ",
        });
      });
    } else {
      newLogs.push({
        id: `stdout-empty-${Date.now()}`,
        type: "info",
        text: "● No print output",
      });
    }

    newLogs.push({
      id: `exit-${Date.now()}`,
      type: "info",
      text: "● Process exited with code 0",
    });

    setLogs((prev) => [...prev, ...newLogs]);
  }, [executionOutput, executionError, frameCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const cmd = input.trim();
    const id = Date.now().toString();
    const newLogs: LogLine[] = [
      ...logs,
      {
        id,
        type: "cmd",
        text: cmd,
      },
    ];

    if (cmd === "clear") {
      setLogs([]);
    } else if (cmd === "help") {
      newLogs.push({
        id: id + "-h",
        type: "out",
        text: "Available: help, clear, run, status, exit",
      });
      setLogs(newLogs);
    } else if (cmd === "status") {
      newLogs.push({
        id: id + "-s",
        type: "info",
        text: `● WASM runtime: ${isRunning ? "running" : "idle"} | Trace: ${frameCount} frame${frameCount === 1 ? "" : "s"}`,
      });
      setLogs(newLogs);
    } else if (cmd === "run") {
      newLogs.push({
        id: id + "-r",
        type: "out",
        text: ">>> Use the Visualize Code button to re-run.",
      });
      setLogs(newLogs);
    } else if (cmd === "exit") {
      setLogs(newLogs);
      onClose();
    } else {
      newLogs.push({
        id: id + "-e",
        type: "err",
        text: `command not found: ${cmd}`,
      });
      setLogs(newLogs);
    }
    setInput("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{
            height: 0,
            opacity: 0,
          }}
          animate={{
            height,
            opacity: 1,
          }}
          exit={{
            height: 0,
            opacity: 0,
          }}
          transition={
            isResizing
              ? { duration: 0 }
              : { type: "spring", stiffness: 280, damping: 30 }
          }
          className="bg-[var(--terminal-bg)] border-t border-[var(--terminal-border)] overflow-hidden shrink-0 flex flex-col"
        >
          <div
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize terminal"
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
            className="h-2 shrink-0 cursor-row-resize group flex items-center justify-center bg-[var(--terminal-header-bg)] border-b border-[var(--terminal-border)] hover:bg-zinc-800/20 active:bg-zinc-800/40 transition-colors touch-none select-none"
          >
            <div className="w-12 h-1 rounded-full bg-zinc-400/60 group-hover:bg-zinc-500 group-active:bg-cyber/60 transition-colors" />
          </div>

          <div className="h-9 bg-[var(--terminal-header-bg)] border-b border-[var(--terminal-border)] flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <TerminalIcon size={12} className="text-[var(--terminal-cmd)] shrink-0" />
              <span className="text-xs font-mono text-[var(--terminal-text)] opacity-90 uppercase tracking-wider truncate">
                Terminal
              </span>
              <span className="text-xs font-mono text-[var(--terminal-text)] opacity-60 hidden sm:inline">
                — bash
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onClose}
                className="p-1 text-[var(--terminal-text)] opacity-60 hover:opacity-100 hover:bg-zinc-800/20 rounded transition-colors"
                aria-label="Minimize terminal"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-[var(--terminal-text)] opacity-60 hover:text-red-500 hover:opacity-100 hover:bg-zinc-800/20 rounded transition-colors"
                aria-label="Close terminal"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 md:px-4 py-2 font-mono text-xs leading-relaxed min-h-0"
            onClick={() => inputRef.current?.focus()}
          >
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2 py-0.5">
                {log.type === "cmd" && (
                  <span className="text-[var(--terminal-cmd)] select-none">$</span>
                )}
                <span
                  className={
                    log.type === "cmd"
                      ? "text-[var(--terminal-text)] break-all font-medium"
                      : log.type === "err"
                        ? "text-[var(--terminal-err)] break-all"
                        : log.type === "info"
                          ? "text-[var(--terminal-info)] break-all"
                          : "text-[var(--terminal-text)] opacity-85 break-all"
                  }
                >
                  {log.text}
                </span>
              </div>
            ))}

            <form
              onSubmit={handleSubmit}
              className="flex gap-2 items-center pt-1"
            >
              <span className="text-[var(--terminal-cmd)] select-none">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent outline-none text-[var(--terminal-text)] font-mono text-xs caret-[var(--terminal-cmd)] min-w-0"
                spellCheck={false}
                autoComplete="off"
              />
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
