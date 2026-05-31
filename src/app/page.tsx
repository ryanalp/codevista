"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Header } from "@/components/Header";
import { CodeEditor } from "@/components/CodeEditor";
import VisualStage from "@/components/VisualStage";
import { AISidebar } from "@/components/AISidebar";
import { Terminal } from "@/components/Terminal";
import { mockCode, mockTraceData } from "@/components/mockData";
import { executePythonTrace } from "@/utils/pyodideEngine";
import { ChevronLeft, ChevronRight, SkipBack, SkipForward } from "lucide-react";

type MobilePanel = "editor" | "workspace" | "ai";

function WorkspaceDashboard() {
  const [code, setCode] = useState<string>(mockCode);
  const [isRunning, setIsRunning] = useState(false);
  const [hasVisualized, setHasVisualized] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<MobilePanel>("editor");
  const [traceData, setTraceData] = useState(mockTraceData);
  const [stdoutOutput, setStdoutOutput] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const handleVisualize = async () => {
    setIsRunning(true);
    setExecutionError(null);
    setStdoutOutput(null);
    setIsTerminalOpen(true);

    try {
      const result = await executePythonTrace(code);
      setTraceData(result.frames);
      setStdoutOutput(result.stdout);
      setHasVisualized(true);
      setCurrentStep(1);
      setActivePanel("workspace");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Python execution failed";
      setExecutionError(message);
      console.error("UI Trace capture failed:", err);
    } finally {
      setIsRunning(false);
    }
  };

  const handlePanelChange = (panel: MobilePanel) => {
    setActivePanel(panel);
    if (panel === "ai") {
      setIsSidebarOpen(true);
    }
  };

  const currentFrame = hasVisualized
    ? traceData.find((f) => f.step === currentStep) || null
    : null;

  const activeLine = currentFrame ? currentFrame.line : null;

  const totalSteps = traceData.length || 1;
  const canStep = hasVisualized && traceData.length > 0;

  const timelineControls = (
    <div className="h-12 md:h-14 bg-matte border border-zinc-800 rounded-md flex items-center px-2 md:px-4 gap-2 md:gap-4 shrink-0">
      <div className="flex items-center gap-0.5 md:gap-1">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          disabled={!canStep || currentStep <= 1}
          className="p-1.5 md:p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 rounded-md hover:bg-zinc-800/50"
        >
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={!canStep || currentStep <= 1}
          className="p-1.5 md:p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 rounded-md hover:bg-zinc-800/50"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-mono text-zinc-500">Timeline</span>
          <span className="text-xs font-mono text-zinc-300">
            Step {canStep ? currentStep : 0}{" "}
            <span className="text-zinc-600">/ {totalSteps}</span>
          </span>
        </div>
        <input
          type="range"
          min={1}
          max={totalSteps}
          value={currentStep}
          onChange={(e) => setCurrentStep(parseInt(e.target.value, 10))}
          disabled={!canStep}
          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyber disabled:opacity-50"
        />
      </div>

      <div className="flex items-center gap-0.5 md:gap-1">
        <button
          type="button"
          onClick={() =>
            setCurrentStep(Math.min(totalSteps, currentStep + 1))
          }
          disabled={!canStep || currentStep >= totalSteps}
          className="p-1.5 md:p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 rounded-md hover:bg-zinc-800/50"
        >
          <ChevronRight size={20} />
        </button>
        <button
          type="button"
          onClick={() => setCurrentStep(totalSteps)}
          disabled={!canStep || currentStep >= totalSteps}
          className="p-1.5 md:p-2 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 rounded-md hover:bg-zinc-800/50"
        >
          <SkipForward size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-obsidian text-zinc-100 overflow-hidden font-sans">
      <Header
        isRunning={isRunning}
        onVisualize={handleVisualize}
        isTerminalOpen={isTerminalOpen}
        onToggleTerminal={() => setIsTerminalOpen((v) => !v)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
        activePanel={activePanel}
        onPanelChange={handlePanelChange}
      />

      <div className="flex-1 flex flex-col w-full overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col md:flex-row w-full overflow-hidden pt-2 md:pt-3 min-h-0">
          <div
            className={`${
              activePanel === "editor" ? "flex" : "hidden"
            } md:flex w-full md:w-1/3 lg:w-[35%] h-full flex-col min-h-0 shrink-0`}
          >
            <CodeEditor
              code={code}
              onChange={(val) => setCode(val || "")}
              activeLine={activeLine}
            />
          </div>

          <div
            className={`${
              activePanel === "workspace" ? "flex" : "hidden"
            } md:flex flex-1 h-full flex-col m-2 md:m-3 mt-0 md:ml-0 gap-2 md:gap-3 min-h-0 min-w-0`}
          >
            <div className="flex-1 min-h-0">
              <VisualStage
                traceData={traceData}
                currentStep={currentStep}
                hasVisualized={hasVisualized}
              />
            </div>
            {timelineControls}
          </div>

          <AISidebar
            isOpen={isSidebarOpen}
            onClose={() => {
              setIsSidebarOpen(false);
              if (activePanel === "ai") {
                setActivePanel("workspace");
              }
            }}
          />
        </div>

        <AISidebar
          isOpen={isSidebarOpen}
          onClose={() => {
            setIsSidebarOpen(false);
            if (activePanel === "ai") {
              setActivePanel("workspace");
            }
          }}
          isMobileOverlay
        />

        <Terminal
          isOpen={isTerminalOpen}
          onClose={() => setIsTerminalOpen(false)}
          executionOutput={stdoutOutput}
          executionError={executionError}
          frameCount={traceData.length}
          isRunning={isRunning}
        />
      </div>
    </div>
  );
}

const DynamicWorkspace = dynamic(
  () => Promise.resolve(WorkspaceDashboard),
  { ssr: false },
);

export default function Page() {
  return <DynamicWorkspace />;
}
