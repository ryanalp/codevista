"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LinkedListChainProps {
  chain: string[];
}

// ─── Arrow connector ───────────────────────────────────────────────────────────

function Arrow() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, width: 0 }}
      animate={{ opacity: 1, width: 28 }}
      exit={{ opacity: 0, width: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="relative h-px bg-emerald-700/60 shrink-0"
      style={{ width: 28 }}
    >
      {/* arrowhead */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t-2 border-r-2 border-emerald-500/70 rotate-45" />
    </motion.div>
  );
}

// ─── Single circular node ──────────────────────────────────────────────────────

function CircularNode({ data, isHead, isTail }: { data: string; isHead?: boolean; isTail?: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0, x: -20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative flex flex-col items-center gap-1.5 group"
    >
      {/* top label: Head / Tail */}
      {(isHead || isTail) && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-[9px] font-bold uppercase tracking-widest font-mono ${
            isHead ? "text-emerald-400" : "text-zinc-500"
          }`}
        >
          {isHead ? "Head" : "Tail"}
        </motion.span>
      )}

      {/* circle */}
      <div
        className="
          w-12 h-12 rounded-full
          bg-zinc-950
          border-2 border-emerald-500/60
          flex items-center justify-center
          shadow-[0_0_18px_rgba(16,185,129,0.18)]
          transition-shadow duration-300
          group-hover:shadow-[0_0_28px_rgba(16,185,129,0.35)]
          relative
        "
      >
        <span className="font-mono text-sm font-bold text-emerald-300">{data}</span>

        {/* index badge on hover */}
        <div className="absolute -bottom-5 text-[10px] text-zinc-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Node
        </div>
      </div>
    </motion.div>
  );
}

// ─── Null terminator ───────────────────────────────────────────────────────────

function NullTerminator() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-3 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-600/60 text-zinc-500 font-mono text-xs font-bold"
    >
      None
    </motion.div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export function LinkedListChain({ chain }: LinkedListChainProps) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 pb-6 border-b border-zinc-800"
    >
      <h3 className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-4">
        Linked List Chain
      </h3>

      <div className="p-4 rounded-xl bg-zinc-900/80 border border-emerald-500/20 overflow-x-auto">
        <div className="flex flex-row items-center gap-3 min-w-max">
          {/* Head label pill */}
          <motion.span
            layout
            key="head-label"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold shrink-0"
          >
            [ Head ]
          </motion.span>

          {chain.length > 0 && <Arrow />}

          <AnimatePresence mode="popLayout">
            {chain.map((data, idx) => (
              <React.Fragment key={`${data}-${idx}`}>
                <CircularNode
                  data={data}
                  isHead={idx === 0}
                  isTail={idx === chain.length - 1}
                />
                {/* connector arrow — also rendered after the last node before None */}
                <Arrow />
              </React.Fragment>
            ))}
          </AnimatePresence>

          <NullTerminator />
        </div>
      </div>
    </motion.section>
  );
}
