import {
  Play,
  Terminal as TerminalIcon,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";

interface HeaderProps {
  isRunning: boolean;
  onVisualize: () => void;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({
  isRunning,
  onVisualize,
  isTerminalOpen,
  onToggleTerminal,
  isSidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  return (
    <header className="h-14 w-full flex items-center justify-between px-4 border-b border-zinc-800/60 bg-obsidian shrink-0">
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-zinc-500 tracking-wider text-sm">
            NOIRCODE
          </span>
          <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
          <span className="font-sans font-bold text-zinc-100 tracking-wide">
            CODEVISTA
          </span>
        </div>

        <div className="h-4 w-px bg-zinc-800 mx-2"></div>

        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-matte border border-zinc-800/80">
          <div
            className={`w-2 h-2 rounded-full ${isRunning ? "bg-amber animate-pulse" : "bg-cyber"}`}
          ></div>
          <span className="text-xs font-mono text-zinc-400">
            {isRunning ? "WASM Running" : "WASM Idle"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTerminal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border transition-all duration-200 ${isTerminalOpen ? "bg-cyber/10 border-cyber/40 text-cyber" : "bg-matte border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700"}`}
          aria-label="Toggle terminal"
        >
          <TerminalIcon size={13} />
          <span>Terminal</span>
        </button>

        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-md border transition-all duration-200 ${isSidebarOpen ? "bg-matte border-zinc-800 text-zinc-400 hover:text-zinc-100" : "bg-amber/10 border-amber/40 text-amber"}`}
          aria-label={isSidebarOpen ? "Hide AI sidebar" : "Show AI sidebar"}
          title={isSidebarOpen ? "Hide AI sidebar" : "Show AI sidebar"}
        >
          {isSidebarOpen ? (
            <PanelRightClose size={15} />
          ) : (
            <PanelRightOpen size={15} />
          )}
        </button>

        <div className="h-5 w-px bg-zinc-800 mx-1"></div>

        <button
          onClick={onVisualize}
          disabled={isRunning}
          className="flex items-center space-x-2 bg-cyber hover:bg-cyan-400 text-obsidian px-4 py-1.5 rounded-md font-medium text-sm transition-all duration-200 shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Play size={14} className="fill-obsidian" />
          <span>Visualize Code</span>
        </button>
      </div>
    </header>
  );
}
