"use client";

import { Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from "lucide-react";
import type { TraceFrame } from "./mockData";

interface VisualStageProps {
  frame: TraceFrame | null;
  totalSteps: number;
  currentStep: number;
  onStepChange: (step: number) => void;
}

export function VisualStage({
  frame,
  totalSteps,
  currentStep,
  onStepChange,
}: VisualStageProps) {
  const handlePrev = () => {
    if (currentStep > 1) onStepChange(currentStep - 1);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) onStepChange(currentStep + 1);
  };

  return (
    <div className="flex flex-col h-full m-3 mt-0 ml-0 relative">
      <div className="flex-1 bg-matte border border-zinc-800 rounded-md overflow-hidden relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className="absolute top-4 left-4">
          <span className="font-mono text-xs text-zinc-500 uppercase tracking-widest">
            Memory State
          </span>
        </div>

        <div className="relative w-full h-full p-12 flex flex-col gap-12 overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {frame?.variables.map((v) => (
              <motion.div
                key={v.id}
                layout
                initial={{
                  opacity: 0,
                  y: 20,
                  scale: 0.9,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  transition: {
                    duration: 0.2,
                  },
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyber text-sm">{v.name}</span>
                  <span className="text-zinc-600 text-xs font-mono">=</span>
                </div>

                {v.type === "primitive" ? (
                  <motion.div
                    layout
                    className="bg-obsidian border border-zinc-700 rounded px-4 py-2 w-fit min-w-[60px] flex justify-center items-center shadow-lg"
                  >
                    <span className="font-mono text-zinc-100">
                      {String(v.value)}
                    </span>
                  </motion.div>
                ) : (
                  <div className="flex items-center gap-3 flex-wrap">
                    <AnimatePresence mode="popLayout">
                      {(v.value as unknown[]).map((item, idx) => (
                        <Fragment key={`${v.id}-${idx}-${item}`}>
                          <motion.div
                            layout
                            initial={{
                              opacity: 0,
                              scale: 0,
                              x: -20,
                            }}
                            animate={{
                              opacity: 1,
                              scale: 1,
                              x: 0,
                            }}
                            exit={{
                              opacity: 0,
                              scale: 0,
                              y: 20,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 25,
                            }}
                            className="w-12 h-12 rounded-full bg-obsidian border-2 border-cyber/50 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.1)] relative group"
                          >
                            <span className="font-mono text-zinc-100">
                              {String(item)}
                            </span>
                            <div className="absolute -bottom-5 text-[10px] text-zinc-600 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                              [{idx}]
                            </div>
                          </motion.div>

                          {idx < (v.value as unknown[]).length - 1 && (
                            <motion.div
                              layout
                              initial={{
                                opacity: 0,
                                width: 0,
                              }}
                              animate={{
                                opacity: 1,
                                width: 24,
                              }}
                              exit={{
                                opacity: 0,
                                width: 0,
                              }}
                              className="h-px bg-zinc-700 relative"
                            >
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 border-t border-r border-zinc-700 rotate-45"></div>
                            </motion.div>
                          )}
                        </Fragment>
                      ))}
                    </AnimatePresence>

                    {(v.value as unknown[]).length === 0 && (
                      <motion.div
                        layout
                        className="text-zinc-600 font-mono text-sm italic"
                      >
                        Empty List
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {!frame && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-600 font-mono text-sm">
              Click &quot;Visualize Code&quot; to begin execution trace.
            </div>
          )}
        </div>
      </div>

      <div className="h-16 bg-matte border border-zinc-800 rounded-md mt-3 flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStepChange(1)}
            disabled={currentStep <= 1 || !frame}
            className="p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors rounded-md hover:bg-zinc-800/50"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={handlePrev}
            disabled={currentStep <= 1 || !frame}
            className="p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors rounded-md hover:bg-zinc-800/50"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-1">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-mono text-zinc-500">Timeline</span>
            <span className="text-xs font-mono text-zinc-300">
              Step {frame ? currentStep : 0}{" "}
              <span className="text-zinc-600">/ {totalSteps}</span>
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={totalSteps || 1}
            value={currentStep}
            onChange={(e) => onStepChange(parseInt(e.target.value, 10))}
            disabled={!frame}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyber disabled:opacity-50"
          />
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleNext}
            disabled={currentStep >= totalSteps || !frame}
            className="p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors rounded-md hover:bg-zinc-800/50"
          >
            <ChevronRight size={20} />
          </button>
          <button
            onClick={() => onStepChange(totalSteps)}
            disabled={currentStep >= totalSteps || !frame}
            className="p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors rounded-md hover:bg-zinc-800/50"
          >
            <SkipForward size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
