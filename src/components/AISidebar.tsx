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
}

export function AISidebar({ isOpen, onClose }: AISidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "system",
      content:
        "CodeVista AI Detective initialized. Ready to analyze execution traces.",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I'm analyzing the current execution frame. The array `arr` just had an element popped.",
        },
      ]);
    }, 1000);
  };

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.aside
          initial={{
            width: 0,
            opacity: 0,
          }}
          animate={{
            width: 360,
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
          className="h-full shrink-0 overflow-hidden"
        >
          <div className="flex flex-col h-full bg-matte border border-zinc-800 rounded-md overflow-hidden m-3 mt-0 ml-0 w-[336px]">
            <div className="h-10 bg-[#0D0D0F] border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 gap-2">
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
              className="flex-1 overflow-y-auto p-4 flex flex-col gap-4"
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

            <div className="p-3 bg-[#0D0D0F] border-t border-zinc-800 shrink-0">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about the trace..."
                  className="w-full bg-matte border border-zinc-800 rounded-md py-2 pl-3 pr-10 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-cyber disabled:opacity-50 disabled:hover:text-zinc-500 transition-colors"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
