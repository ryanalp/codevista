"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  ArrowRight,
  Code,
  Cpu,
  Layers,
  Sparkles,
  Database,
  ArrowRightLeft,
  Workflow,
  CheckCircle,
  Sun,
  Moon,
} from "lucide-react";

// ─── Looping Mockup Configuration ─────────────────────────────────────────────

interface MockVariable {
  name: string;
  value: any;
  type: "primitive" | "list";
}

interface MockStep {
  line: number;
  codeLines: { text: string; active: boolean }[];
  variables: MockVariable[];
}

const mockSteps: MockStep[] = [
  {
    line: 1,
    codeLines: [
      { text: "arr = [10, 20]", active: true },
      { text: "x = 5", active: false },
      { text: "arr.append(30)", active: false },
      { text: "y = x * 2", active: false },
      { text: "arr.append(40)", active: false },
    ],
    variables: [{ name: "arr", value: [10, 20], type: "list" }],
  },
  {
    line: 2,
    codeLines: [
      { text: "arr = [10, 20]", active: false },
      { text: "x = 5", active: true },
      { text: "arr.append(30)", active: false },
      { text: "y = x * 2", active: false },
      { text: "arr.append(40)", active: false },
    ],
    variables: [
      { name: "arr", value: [10, 20], type: "list" },
      { name: "x", value: 5, type: "primitive" },
    ],
  },
  {
    line: 3,
    codeLines: [
      { text: "arr = [10, 20]", active: false },
      { text: "x = 5", active: false },
      { text: "arr.append(30)", active: true },
      { text: "y = x * 2", active: false },
      { text: "arr.append(40)", active: false },
    ],
    variables: [
      { name: "arr", value: [10, 20, 30], type: "list" },
      { name: "x", value: 5, type: "primitive" },
    ],
  },
  {
    line: 4,
    codeLines: [
      { text: "arr = [10, 20]", active: false },
      { text: "x = 5", active: false },
      { text: "arr.append(30)", active: false },
      { text: "y = x * 2", active: true },
      { text: "arr.append(40)", active: false },
    ],
    variables: [
      { name: "arr", value: [10, 20, 30], type: "list" },
      { name: "x", value: 5, type: "primitive" },
      { name: "y", value: 10, type: "primitive" },
    ],
  },
  {
    line: 5,
    codeLines: [
      { text: "arr = [10, 20]", active: false },
      { text: "x = 5", active: false },
      { text: "arr.append(30)", active: false },
      { text: "y = x * 2", active: false },
      { text: "arr.append(40)", active: true },
    ],
    variables: [
      { name: "arr", value: [10, 20, 30, 40], type: "list" },
      { name: "x", value: 5, type: "primitive" },
      { name: "y", value: 10, type: "primitive" },
    ],
  },
];

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Synchronize base theme with document root class list
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [theme]);

  // Loop execution mockup every 2.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % mockSteps.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const currentMockFrame = mockSteps[activeStep];
  const listVar = currentMockFrame.variables.find((v) => v.type === "list");
  const primitives = currentMockFrame.variables.filter((v) => v.type === "primitive");

  return (
    <div className="min-h-screen bg-obsidian text-zinc-100 overflow-x-hidden relative font-sans">
      {/* Background Gradients & Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-zinc-800)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-zinc-800)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.25] pointer-events-none" />
      <div className="absolute top-[10%] left-[15%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[140px] pointer-events-none" />

      {/* Navigation */}
      <header className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between border-b border-zinc-800/40 relative z-10">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-zinc-500 tracking-wider text-xs uppercase">
            NOIRCODE
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
          <span className="font-bold text-zinc-100 tracking-wide text-sm md:text-base">
            CODEVISTA
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-8 text-xs font-mono text-zinc-400">
          <a href="#features" className="hover:text-zinc-100 transition-colors">
            Features
          </a>
          <a
            href="https://github.com/ryanalp/codevista"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-100 transition-colors"
          >
            GitHub
          </a>
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
            <span>WASM Sandbox Active</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-all duration-200 shrink-0"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <Link
            href="/visualizer"
            className="flex items-center space-x-1 px-4 py-1.5 rounded-md text-xs font-medium bg-cyan-500 text-obsidian hover:bg-cyan-400 transition-all shadow-[0_0_12px_rgba(6,182,212,0.25)]"
          >
            <span>Launch Visualizer</span>
            <ArrowRight size={12} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-12 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] md:text-xs font-mono text-cyan-400 mb-6 uppercase tracking-wider">
            <Sparkles size={12} />
            <span>Browser-Based Execution Visualizer</span>
          </div>

          <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-zinc-100 mb-6 leading-[1.1]">
            Watch Your Code <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
              Come to Life.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm md:text-lg text-zinc-400 mb-10 leading-relaxed">
            Stop guessing what your variables contain. Visualize execution traces
            line-by-line. See variables, list nodes, and pointers render on a
            memory stage inside your browser.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/visualizer"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 rounded-lg text-sm font-semibold bg-cyan-500 text-obsidian hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all font-sans shrink-0"
            >
              <span>Try Visualizer</span>
              <ArrowRight size={15} />
            </Link>

            <a
              href="https://github.com/ryanalp/codevista"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3.5 rounded-lg text-sm font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all font-sans"
            >
              <svg
                className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
              <span>View on GitHub</span>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Interactive Mockup/Preview Area */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-24 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-full rounded-xl bg-zinc-900/60 border border-zinc-800/80 shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden backdrop-blur-md"
        >
          {/* Mockup Header */}
          <div className="h-10 bg-zinc-950 border-b border-zinc-850 flex items-center justify-between px-4">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
              <span className="text-[10px] text-zinc-500 font-mono pl-3">
                workspace.py — CodeVista Preview
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[10px] font-mono text-cyan-400">
              <span className="animate-pulse">●</span>
              <span>Running Simulation</span>
            </div>
          </div>

          {/* Mockup Splitted Workspace */}
          <div className="flex flex-col md:flex-row h-[320px] md:h-[400px]">
            {/* Editor Pane (Left) */}
            <div className="w-full md:w-[40%] bg-zinc-950/80 border-b md:border-b-0 md:border-r border-zinc-800/60 p-4 font-mono text-xs flex flex-col min-h-0 overflow-y-auto">
              <div className="flex-1 flex flex-col space-y-1">
                {currentMockFrame.codeLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center w-full py-1.5 px-2 rounded transition-all duration-300 ${
                      line.active
                        ? "bg-cyan-500/10 border-l-2 border-cyan-500 text-cyan-500"
                        : "text-zinc-400"
                    }`}
                  >
                    <span className="w-6 text-zinc-600 text-[10px] select-none text-right pr-2">
                      {idx + 1}
                    </span>
                    <span className="whitespace-pre">{line.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Stage/Memory Canvas Pane (Right) */}
            <div className="flex-1 bg-zinc-900/30 p-6 flex flex-col relative overflow-hidden min-h-0">
              {/* Grid Background inside canvas */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-[0.06] pointer-events-none" />

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800/80">
                  <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
                    Memory Stage Canvas
                  </span>
                  <span className="text-[10px] bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 px-2 py-0.5 rounded font-mono">
                    Step {activeStep + 1} of 5
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-6">
                  {/* Primitives visualization */}
                  {primitives.length > 0 && (
                    <div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Primitives
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <AnimatePresence>
                          {primitives.map((prim) => (
                            <motion.div
                              key={prim.name}
                              initial={{ opacity: 0, scale: 0.8, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="relative px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg shadow-md min-w-[70px] text-center"
                            >
                              <span className="absolute -top-2 left-2 px-1 text-[8px] bg-zinc-800 text-zinc-400 rounded uppercase font-bold border border-zinc-700">
                                {prim.name}
                              </span>
                              <span className="font-mono font-bold text-xs text-zinc-200">
                                {prim.value}
                              </span>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}

                  {/* List visual nodes with animated appending */}
                  {listVar && (
                    <div>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Data Structures ({listVar.name})
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <AnimatePresence mode="popLayout">
                          {listVar.value.map((item: number, index: number) => (
                            <div key={`${index}-${item}`} className="flex items-center">
                              <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 350,
                                  damping: 20,
                                }}
                                className="w-10 h-10 rounded-full bg-white dark:bg-zinc-950 border-2 border-emerald-500/60 flex items-center justify-center shadow-sm shrink-0 relative"
                              >
                                <span className="font-mono text-xs text-emerald-600 dark:text-emerald-500 font-bold">
                                  {item}
                                </span>
                                <span className="absolute -bottom-4 text-[8px] text-zinc-500 font-mono">
                                  [{index}]
                                </span>
                              </motion.div>

                              {index < listVar.value.length - 1 && (
                                <motion.div
                                  layout
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: 16 }}
                                  className="h-px bg-zinc-800 relative w-4 shrink-0 mx-1"
                                >
                                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-zinc-800 rotate-45" />
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16 relative z-10 border-t border-zinc-900">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl mb-4">
            Built for Developers Who Learn Visually
          </h2>
          <p className="max-w-2xl mx-auto text-sm text-zinc-400">
            CodeVista runs your code in the browser sandbox and draws execution
            paths, variables, and states automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group relative p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-cyan-500/30 transition-all hover:bg-zinc-900/60">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-cyan-500/5 blur-xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-500 mb-4 border border-cyan-500/20">
              <Workflow size={20} />
            </div>
            <h3 className="text-base font-semibold text-zinc-100 mb-2">
              Line-by-Line Execution
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Step forward and backward through timeline traces. Watch variable bindings update 
              and array items shift instantly at each execution step.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group relative p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-violet-500/30 transition-all hover:bg-zinc-900/60">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-violet-500/5 blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-colors" />
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center text-indigo-500 mb-4 border border-violet-500/20">
              <Database size={20} />
            </div>
            <h3 className="text-base font-semibold text-zinc-100 mb-2">
              Animated Memory States
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Pointers, nodes, and complex data structures are automatically identified and drawn.
              Watch list linkages reconstruct and values slide into memory elements.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group relative p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80 hover:border-blue-500/30 transition-all hover:bg-zinc-900/60">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-blue-500/5 blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-cyan-500 mb-4 border border-blue-500/20">
              <Cpu size={20} />
            </div>
            <h3 className="text-base font-semibold text-zinc-100 mb-2">
              Isolated Client Sandbox
            </h3>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Execution runs purely in your browser sandbox using Pyodide and WebAssembly (WASM).
              No server request latency—your code stays completely local and private.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-zinc-900 text-center text-xs font-mono text-zinc-500 z-10 relative">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span>CodeVista © {new Date().getFullYear()}</span>
            <span>—</span>
            <span>Interactive Code Visualizer</span>
          </div>
          <div className="flex items-center space-x-6">
            <a
              href="https://github.com/ryanalp/codevista"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors flex items-center space-x-1"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.167 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
