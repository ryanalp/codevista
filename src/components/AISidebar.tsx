"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Send, Sparkles, X } from "lucide-react";

interface Message {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
}

interface AISidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobileOverlay?: boolean;
  /** The current code in the workspace editor — sent to the AI on every message. */
  codeContext?: string;
}

export function AISidebar({
  isOpen,
  onClose,
  isMobileOverlay = false,
  codeContext = "",
}: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "system",
      content:
        "You are CodeVista AI Detective. Answer user questions about code execution traces, state, and control flow using concise language.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: updatedMessages, codeContext }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error || "AI request failed.");
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.completion || "I could not generate a response.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const panel = (
    <div
      className={`flex flex-col h-full bg-matte border border-zinc-800 rounded-md overflow-hidden ${
        isMobileOverlay ? "w-full" : "m-3 mt-0 ml-0 w-full md:w-[336px]"
      }`}
    >
      <div className="h-10 bg-obsidian border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-amber" />
          <span className="text-xs font-mono text-zinc-300 uppercase tracking-wider">
            AI Detective
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
          aria-label="Close AI sidebar"
        >
          <X size={14} />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-4 min-h-0"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1.5 px-1">
              {msg.role === "system" && (
                <Terminal size={10} className="text-zinc-500" />
              )}
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                {msg.role}
              </span>
            </div>
            <div
              className={`text-sm px-3 py-2 rounded-lg max-w-[90%] ${msg.role === "user" ? "bg-zinc-800 text-zinc-100 rounded-tr-sm" : msg.role === "system" ? "bg-transparent border border-zinc-800 text-zinc-400 font-mono text-xs" : "bg-obsidian border border-zinc-800 text-zinc-300 rounded-tl-sm"}`}
            >
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-obsidian border-t border-zinc-800 shrink-0">
        <form onSubmit={handleSubmit} className="relative">
          {error ? (
            <div className="mb-2 rounded-md border border-red-600 bg-red-950/40 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          ) : null}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Generating response..." : "Ask about the trace..."}
            disabled={isLoading}
            className="w-full bg-matte border border-zinc-800 rounded-md py-2 pl-3 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all disabled:cursor-not-allowed disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-cyber disabled:opacity-50 disabled:hover:text-zinc-500 transition-colors"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );

  if (isMobileOverlay) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 right-0 w-full max-w-sm z-50 p-3 md:hidden"
            >
              {panel}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.aside
          initial={{
            width: 0,
            opacity: 0,
          }}
          animate={{
            width: "auto",
            opacity: 1,
          }}
          exit={{
            width: 0,
            opacity: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 30,
          }}
          className="hidden md:block h-full shrink-0 overflow-hidden"
        >
          {panel}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
