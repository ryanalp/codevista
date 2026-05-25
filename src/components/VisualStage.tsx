"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TraceVariable {
  id: string;
  name: string;
  type: "primitive" | "list" | "dict";
  value: any;
}

interface TraceFrame {
  step: number;
  line: number;
  variables: TraceVariable[];
  stdout?: string;
}

interface VisualStageProps {
  traceData: TraceFrame[];
  currentStep: number;
  hasVisualized: boolean;
}

interface ParsedNodeLink {
  data: string;
  hasNext: boolean;
  nextData: string | null;
  repr: string;
}

function isNodeRepr(value: unknown): value is string {
  return typeof value === "string" && /Node\s*\(/i.test(value);
}

function isLinkedListContainer(variable: TraceVariable): boolean {
  if (variable.name === "self") return true;
  const text = String(variable.value);
  return text === "LinkedList" || /LinkedList\s*\(/i.test(text);
}

function hasLinkedListStructure(variables: TraceVariable[]): boolean {
  const hasContainer = variables.some(isLinkedListContainer);
  const hasNodes = variables.some((v) => isNodeRepr(v.value));
  const hasHeadPointer = variables.some((v) => v.name === "head");
  return (hasContainer && hasNodes) || (hasNodes && hasHeadPointer);
}

function extractBalancedNodeExpr(text: string, startIndex: number): string {
  const nodeStart = text.slice(startIndex).search(/Node\s*\(/i);
  if (nodeStart === -1) return "";

  const absoluteStart = startIndex + nodeStart;
  let depth = 0;
  for (let i = absoluteStart; i < text.length; i++) {
    if (text[i] === "(") depth++;
    else if (text[i] === ")") {
      depth--;
      if (depth === 0) return text.slice(absoluteStart, i + 1);
    }
  }
  return text.slice(absoluteStart);
}

function parseNodeData(repr: string): string | null {
  return repr.match(/data:\s*([^,)]+)/i)?.[1]?.trim() ?? null;
}

function parseNodeLink(repr: string): ParsedNodeLink | null {
  const data = parseNodeData(repr);
  if (!data) return null;

  const nextMatch = repr.match(/next\s*[=:]\s*([\s\S]+)$/i);
  const nextRaw = nextMatch?.[1]?.trim() ?? "";

  const pointsToNone = /^(None|False)\b/i.test(nextRaw);
  const nestedNode = /Node\s*\(/i.test(nextRaw);
  const pointsToTrue = /^True\b/i.test(nextRaw);
  const nestedData = nestedNode ? parseNodeData(extractBalancedNodeExpr(nextRaw, 0)) : null;

  return {
    data,
    hasNext: !pointsToNone && (nestedNode || pointsToTrue),
    nextData: nestedData,
    repr,
  };
}

/** Walks a nested Node repr: Node(data: 1, next=Node(data: 2, next=None)) */
function walkNestedNodeChain(repr: string): string[] {
  const chain: string[] = [];
  let current = repr.trim();

  while (current && /Node\s*\(/i.test(current)) {
    const data = parseNodeData(current);
    if (!data) break;
    chain.push(data);

    const nextMatch = current.match(/next\s*[=:]\s*([\s\S]+)$/i);
    const nextRaw = nextMatch?.[1]?.trim() ?? "";

    if (/^(None|False)\b/i.test(nextRaw)) break;

    if (/^True\b/i.test(nextRaw)) break;

    if (/Node\s*\(/i.test(nextRaw)) {
      current = extractBalancedNodeExpr(nextRaw, 0);
      continue;
    }

    break;
  }

  return chain;
}

function followChainByPointers(
  startData: string,
  nodes: ParsedNodeLink[],
): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();
  let currentData: string | null = startData;

  while (currentData && !visited.has(currentData)) {
    chain.push(currentData);
    visited.add(currentData);

    const node = nodes.find((n) => n.data === currentData);
    if (!node?.hasNext) break;

    if (node.nextData && !visited.has(node.nextData)) {
      currentData = node.nextData;
      continue;
    }

    const nextUnvisited = nodes.find(
      (n) => !visited.has(n.data) && n.data !== currentData,
    );
    if (!nextUnvisited) break;
    currentData = nextUnvisited.data;
  }

  return chain;
}

function buildGlobalLinkedListChain(variables: TraceVariable[]): string[] {
  const nodeVariables = variables.filter((v) => isNodeRepr(v.value));
  if (nodeVariables.length === 0) return [];

  const headVariable =
    variables.find((v) => v.name === "head" && isNodeRepr(v.value)) ??
    variables.find((v) => v.name === "head");

  if (headVariable && isNodeRepr(headVariable.value)) {
    const nestedChain = walkNestedNodeChain(headVariable.value);
    if (nestedChain.length > 0) return nestedChain;
  }

  const parsedNodes = nodeVariables
    .map((v) => parseNodeLink(String(v.value)))
    .filter((n): n is ParsedNodeLink => n !== null);

  if (parsedNodes.length === 0) return [];

  const deeplyNested = parsedNodes.find((n) => /next\s*[=:]\s*Node\s*\(/i.test(n.repr));
  if (deeplyNested) {
    const nestedChain = walkNestedNodeChain(deeplyNested.repr);
    if (nestedChain.length > 0) return nestedChain;
  }

  const headPointer = variables.find((v) => v.name === "head");
  const headData =
    headVariable && isNodeRepr(headVariable.value)
      ? parseNodeData(headVariable.value)
      : headPointer
        ? parseNodeData(String(headPointer.value))
        : null;

  if (headData) {
    const pointerChain = followChainByPointers(headData, parsedNodes);
    if (pointerChain.length > 0) return pointerChain;
  }

  const tailCandidates = parsedNodes.filter((n) => !n.hasNext);
  if (tailCandidates.length === 1 && parsedNodes.length > 1) {
    const ordered: string[] = [];
    const remaining = new Map(parsedNodes.map((n) => [n.data, n]));
    let tail = tailCandidates[0].data;
    const reverse: string[] = [tail];
    remaining.delete(tail);

    while (remaining.size > 0) {
      const parent = [...remaining.values()].find(
        (n) => n.nextData === tail || (n.hasNext && !n.nextData),
      );
      if (!parent) break;
      reverse.unshift(parent.data);
      remaining.delete(parent.data);
      tail = parent.data;
    }

    if (reverse.length > 1) return reverse;
  }

  return parsedNodes.map((n) => n.data);
}

function GlobalLinkedListChain({ chain }: { chain: string[] }) {
  return (
    <motion.section
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 pb-6 border-b border-zinc-800"
    >
      <h3 className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-4">
        Global Linked List Chain
      </h3>

      <motion.div
        layout
        className="flex flex-row flex-wrap items-center justify-center gap-3 p-4 rounded-xl bg-zinc-900/80 border border-emerald-500/20"
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            layout
            key="head-label"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold"
          >
            [ Head ]
          </motion.span>

          {chain.length > 0 && (
            <motion.span
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-zinc-500 font-bold text-lg select-none"
            >
              ➔
            </motion.span>
          )}

          {chain.map((data, idx) => (
            <React.Fragment key={`${data}-${idx}`}>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.85, x: -12 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="px-4 py-2 rounded-lg bg-zinc-950 border-2 border-emerald-500/50 text-emerald-400 font-mono text-sm font-bold shadow-[0_0_16px_rgba(16,185,129,0.12)]"
              >
                ( Node: {data} )
              </motion.div>
              <motion.span
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-zinc-500 font-bold text-lg select-none"
              >
                ➔
              </motion.span>
            </React.Fragment>
          ))}

          <motion.span
            layout
            key="none-tail"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-600 text-zinc-400 font-mono text-xs font-bold"
          >
            [ None ]
          </motion.span>
        </AnimatePresence>
      </motion.div>
    </motion.section>
  );
}

export default function VisualStage({
  traceData,
  currentStep,
  hasVisualized,
}: VisualStageProps) {
  const currentFrame = hasVisualized
    ? traceData.find((f) => f.step === currentStep) || null
    : null;

  if (!hasVisualized || !currentFrame) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/50 p-8">
        <p className="text-lg font-medium text-zinc-400">
          Execution Stage Empty
        </p>
        <p className="text-sm text-center max-w-xs mt-1">
          Type your code on the left and click &apos;Visualize Code&apos; to see
          your variables come to life.
        </p>
      </div>
    );
  }

  const showGlobalChain = hasLinkedListStructure(currentFrame.variables);
  const globalChain = showGlobalChain
    ? buildGlobalLinkedListChain(currentFrame.variables)
    : [];

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-3">
        <h2 className="text-sm font-semibold tracking-wider text-zinc-400 uppercase">
          Memory State Workspace
        </h2>
        <div className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-md border border-indigo-500/20 font-mono">
          Step {currentFrame.step} (Line {currentFrame.line})
        </div>
      </div>

      {showGlobalChain && (
        <GlobalLinkedListChain chain={globalChain} />
      )}

      <h3 className="text-xs font-bold tracking-widest text-zinc-500 uppercase mb-4">
        Local Scope Variables
      </h3>

      {currentFrame.variables.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-zinc-600 italic text-sm">
          No variables active in current execution scope frame.
        </div>
      ) : (
        <div className="flex flex-col gap-6 flex-1">
          <AnimatePresence mode="popLayout">
            <div className="flex flex-wrap items-center justify-center gap-6 p-4">
              {currentFrame.variables.map((variable, idx) => {
                const isNode =
                  typeof variable.value === "string" &&
                  variable.value.includes("Node(");

                return (
                  <React.Fragment key={variable.id}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: -10 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                      }}
                      className={`relative flex flex-col items-center p-4 rounded-xl min-w-[120px] border shadow-xl bg-zinc-900 ${
                        isNode
                          ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
                          : "border-zinc-800"
                      }`}
                    >
                      <span className="absolute -top-3 left-3 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-zinc-800 text-zinc-400 border border-zinc-700 shadow-md">
                        {variable.name}
                      </span>

                      <div className="mt-2 text-center w-full">
                        {isNode ? (
                          <div className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full border-2 border-emerald-500 bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-mono font-bold shadow-inner">
                              {variable.value.match(/data:\s*([^,)]+)/)?.[1] ||
                                "Node"}
                            </div>
                            <span className="text-[10px] text-zinc-500 mt-2 font-mono">
                              next:{" "}
                              {variable.value.includes("next: True") ||
                              /next\s*[=:]\s*Node\s*\(/i.test(variable.value)
                                ? "Linked"
                                : "None"}
                            </span>
                          </div>
                        ) : Array.isArray(variable.value) ? (
                          <div className="flex items-center gap-1.5 bg-zinc-950 p-2 rounded-lg border border-zinc-800 overflow-x-auto max-w-[200px]">
                            {variable.value.map((item, i) => (
                              <span
                                key={i}
                                className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center text-xs font-mono font-bold"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="font-mono text-sm font-bold text-zinc-200 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800 inline-block min-w-[60px]">
                            {String(variable.value)}
                          </span>
                        )}
                      </div>
                    </motion.div>

                    {idx < currentFrame.variables.length - 1 && (
                      <motion.div
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-zinc-700 font-bold text-xl select-none"
                      >
                        →
                      </motion.div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
