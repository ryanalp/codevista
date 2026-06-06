"use client";

import React, { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LinkedListChain } from "./LinkedListChain";
import {
  TraceFrame,
  hasLinkedListStructure,
  buildGlobalLinkedListChain,
  isNodeRepr,
  parseNodeData,
} from "./visualStageUtils";

interface VisualStageProps {
  traceData: TraceFrame[];
  currentStep: number;
  hasVisualized: boolean;
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50 p-8">
        <p className="text-lg font-medium text-zinc-400">Execution Stage Empty</p>
        <p className="text-sm text-center max-w-xs mt-1">
          Type your code on the left and click &apos;Visualize Code&apos; to see
          your variables come to life.
        </p>
      </div>
  );
}

// ─── Arrow between variable cards ─────────────────────────────────────────────

function CardArrow() {
  return (
      <motion.div
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-zinc-700 font-bold text-xl select-none shrink-0"
      >
        →
      </motion.div>
  );
}

// ─── Primitive value display ───────────────────────────────────────────────────

function PrimitiveValue({ value }: { value: unknown }) {
  return (
      <span className="font-mono text-sm font-bold text-zinc-200 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 inline-block min-w-[60px] text-center">
      {String(value)}
    </span>
  );
}

// ─── List value display — circular nodes with animated connectors ──────────────

function ListValue({ items }: { items: unknown[] }) {
  if (items.length === 0) {
    return (
        <motion.span layout className="text-zinc-600 font-mono text-xs italic">
          Empty List
        </motion.span>
    );
  }

  return (
      <div className="flex items-center gap-3 flex-wrap">
        <AnimatePresence mode="popLayout">
          {items.map((item, idx) => (
              <Fragment key={`item-${idx}-${item}`}>
                {/* circular node */}
                <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0, y: 20 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="w-12 h-12 rounded-full bg-zinc-950 border-2 border-cyan-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.12)] relative group shrink-0"
                >
              <span className="font-mono text-sm text-zinc-100 font-bold">
                {String(item)}
              </span>
                  <div className="absolute -bottom-5 text-[10px] text-zinc-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    [{idx}]
                  </div>
                </motion.div>

                {/* connector arrow */}
                {idx < items.length - 1 && (
                    <motion.div
                        layout
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 24 }}
                        exit={{ opacity: 0, width: 0 }}
                        className="h-px bg-zinc-700 relative shrink-0"
                        style={{ width: 24 }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-zinc-700 rotate-45" />
                    </motion.div>
                )}
              </Fragment>
          ))}
        </AnimatePresence>
      </div>
  );
}

// ─── Node (linked-list node) display — circular with emerald ring ──────────────

function NodeValue({ repr }: { repr: string }) {
  const data = parseNodeData(repr) ?? "?";
  const isLinked =
      repr.includes("next: True") || /next\s*[=:]\s*Node\s*\(/i.test(repr);

  return (
      <div className="flex flex-col items-center gap-1.5">
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-12 h-12 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.2)] group"
        >
          <span className="font-mono text-sm font-bold text-emerald-300">{data}</span>
        </motion.div>
        <span className="text-[10px] text-zinc-500 font-mono">
        next: {isLinked ? "Linked" : "None"}
      </span>
      </div>
  );
}

// ─── Variable card ─────────────────────────────────────────────────────────────

function VariableCard({
                        variable,
                      }: {
  variable: TraceFrame["variables"][number];
}) {
  const isNode = isNodeRepr(variable.value);
  const isList = Array.isArray(variable.value);

  return (
      <motion.div
          layout
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`relative flex flex-col items-center p-4 pt-6 rounded-xl min-w-[120px] border shadow-xl bg-zinc-900 ${
              isNode
                  ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
                  : "border-zinc-800"
          }`}
      >
        {/* variable name badge */}
        <span className="absolute -top-3 left-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-zinc-800 text-zinc-400 border border-zinc-700 shadow-md">
        {variable.name}
      </span>

        <div className="mt-1 text-center w-full flex justify-center">
          {isNode ? (
              <NodeValue repr={String(variable.value)} />
          ) : isList ? (
              <ListValue items={variable.value as unknown[]} />
          ) : (
              <PrimitiveValue value={variable.value} />
          )}
        </div>
      </motion.div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export default function VisualStage({
                                      traceData,
                                      currentStep,
                                      hasVisualized,
                                    }: VisualStageProps) {
  const currentFrame = hasVisualized
      ? (traceData.find((f) => f.step === currentStep) ?? null)
      : null;

  if (!hasVisualized || !currentFrame) return <EmptyState />;

  const showGlobalChain = hasLinkedListStructure(currentFrame.variables);
  const globalChain = showGlobalChain
      ? buildGlobalLinkedListChain(currentFrame.variables)
      : [];

  return (
      <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 sm:p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-zinc-800 pb-3 gap-2">
          <h2 className="text-xs sm:text-sm font-semibold tracking-wider text-zinc-400 uppercase truncate">
            Memory State Workspace
          </h2>
          <div className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-500/20 font-mono shrink-0">
            Step {currentFrame.step} (Line {currentFrame.line})
          </div>
        </div>

        {/* Linked-list global chain (circular nodes) */}
        {showGlobalChain && <LinkedListChain chain={globalChain} />}

        {/* Console output */}
        {currentFrame.stdout?.trim() && (
            <motion.section
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 pb-6 border-b border-zinc-800"
            >
              <h3 className="text-xs font-bold tracking-widest text-cyan-400 uppercase mb-3">
                Console Output
              </h3>
              <pre className="font-mono text-xs text-zinc-300 bg-zinc-900/80 border border-cyan-500/20 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
            {currentFrame.stdout.trimEnd()}
          </pre>
            </motion.section>
        )}

        {/* Local scope variables */}
        <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-4">
          Local Scope Variables
        </h3>

        {currentFrame.variables.length === 0 ? (
            <div className="flex items-center justify-center flex-1 text-zinc-600 italic text-sm">
              No variables active in current execution scope frame.
            </div>
        ) : (
            <div className="flex flex-col flex-1">
              <AnimatePresence mode="popLayout">
                <div className="flex flex-wrap items-center justify-center gap-6 p-4">
                  {currentFrame.variables.map((variable, idx) => (
                      <Fragment key={variable.id}>
                        <VariableCard variable={variable} />
                        {idx < currentFrame.variables.length - 1 && <CardArrow />}
                      </Fragment>
                  ))}
                </div>
              </AnimatePresence>
            </div>
        )}
      </div>
  );
}