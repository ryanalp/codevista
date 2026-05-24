"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { CodeEditor } from "@/components/CodeEditor";
import { VisualStage } from "@/components/VisualStage";
import { AISidebar } from "@/components/AISidebar";
import { Terminal } from "@/components/Terminal";
import { mockCode, mockTraceData } from "@/components/mockData";

export default function Home() {
  const [code, setCode] = useState<string>(mockCode);
  const [isRunning, setIsRunning] = useState(false);
  const [hasVisualized, setHasVisualized] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleVisualize = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasVisualized(true);
      setCurrentStep(1);
    }, 1500);
  };

  const currentFrame = hasVisualized
    ? mockTraceData.find((f) => f.step === currentStep) || null
    : null;

  const activeLine = currentFrame ? currentFrame.line : null;

  return (
    <div className="flex flex-col h-screen w-full bg-obsidian text-zinc-100 overflow-hidden font-sans">
      <Header
        isRunning={isRunning}
        onVisualize={handleVisualize}
        isTerminalOpen={isTerminalOpen}
        onToggleTerminal={() => setIsTerminalOpen((v) => !v)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
      />

      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <div className="flex-1 flex w-full overflow-hidden pt-3 min-h-0">
          <div className="w-1/3 min-w-[300px] h-full flex flex-col">
            <CodeEditor
              code={code}
              onChange={(val) => setCode(val || "")}
              activeLine={activeLine}
            />
          </div>

          <div className="flex-1 min-w-[400px] h-full flex flex-col">
            <VisualStage
              frame={currentFrame}
              totalSteps={mockTraceData.length}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </div>

          <AISidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>

        <Terminal
          isOpen={isTerminalOpen}
          onClose={() => setIsTerminalOpen(false)}
        />
      </div>
    </div>
  );
}
