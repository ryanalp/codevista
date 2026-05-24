"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as TerminalIcon, X, Minus } from "lucide-react";

interface TerminalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LogLine {
  id: string;
  type: "cmd" | "out" | "err" | "info";
  text: string;
}

const initialLogs: LogLine[] = [
  {
    id: "1",
    type: "info",
    text: "● CodeVista Terminal v0.1.0 — WASM Python runtime",
  },
  {
    id: "2",
    type: "info",
    text: "● Type `help` for available commands.",
  },
  {
    id: "3",
    type: "cmd",
    text: "python main.py",
  },
  {
    id: "4",
    type: "out",
    text: ">>> Executing trace...",
  },
  {
    id: "5",
    type: "out",
    text: ">>> 7 frames captured",
  },
  {
    id: "6",
    type: "out",
    text: ">>> Final result: [1, 2, 4]",
  },
  {
    id: "7",
    type: "info",
    text: "● Process exited with code 0",
  },
];

export function Terminal({ isOpen, onClose }: TerminalProps) {
  const [logs, setLogs] = useState<LogLine[]>(initialLogs);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        text: "● WASM runtime: idle | Trace: loaded (7 frames)",
      });
      setLogs(newLogs);
    } else if (cmd === "run") {
      newLogs.push({
        id: id + "-r",
        type: "out",
        text: ">>> Re-executing trace... done.",
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
            height: 280,
            opacity: 1,
          }}
          exit={{
            height: 0,
            opacity: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 280,
            damping: 30,
          }}
          className="bg-matte border-t border-zinc-800 overflow-hidden shrink-0 flex flex-col"
        >
          <div className="h-9 bg-[#0D0D0F] border-b border-zinc-800 flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2">
              <TerminalIcon size={12} className="text-cyber" />
              <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
                Terminal
              </span>
              <span className="text-xs font-mono text-zinc-600">— bash</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onClose}
                className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                aria-label="Minimize terminal"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                aria-label="Close terminal"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs leading-relaxed"
            onClick={() => inputRef.current?.focus()}
          >
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2 py-0.5">
                {log.type === "cmd" && (
                  <span className="text-cyber select-none">$</span>
                )}
                <span
                  className={
                    log.type === "cmd"
                      ? "text-zinc-100"
                      : log.type === "err"
                        ? "text-red-400"
                        : log.type === "info"
                          ? "text-amber/80"
                          : "text-zinc-400"
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
              <span className="text-cyber select-none">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent outline-none text-zinc-100 font-mono text-xs caret-cyber"
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
