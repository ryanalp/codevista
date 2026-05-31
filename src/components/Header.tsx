import {
  Play,
  Terminal as TerminalIcon,
  PanelRightOpen,
  PanelRightClose,
  Code2,
  Layers,
} from "lucide-react";

type MobilePanel = "editor" | "workspace" | "ai";

interface HeaderProps {
  isRunning: boolean;
  onVisualize: () => void;
  isTerminalOpen: boolean;
  onToggleTerminal: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activePanel?: MobilePanel;
  onPanelChange?: (panel: MobilePanel) => void;
}

export function Header({
  isRunning,
  onVisualize,
  isTerminalOpen,
  onToggleTerminal,
  isSidebarOpen,
  onToggleSidebar,
  activePanel = "editor",
  onPanelChange,
}: HeaderProps) {
  return (
    <header className="w-full flex flex-col border-b border-zinc-800/60 bg-obsidian shrink-0">
      <div className="h-12 md:h-14 w-full flex items-center justify-between px-3 md:px-4 gap-2">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
          <div className="flex items-center space-x-1.5 md:space-x-2 min-w-0">
            <span className="font-mono text-zinc-500 tracking-wider text-xs md:text-sm hidden sm:inline">
              NOIRCODE
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-700 hidden sm:block"></span>
            <span className="font-sans font-bold text-zinc-100 tracking-wide text-sm md:text-base truncate">
              CODEVISTA
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block"></div>

          <div className="hidden sm:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-matte border border-zinc-800/80">
            <div
              className={`w-2 h-2 rounded-full ${isRunning ? "bg-amber animate-pulse" : "bg-cyber"}`}
            ></div>
            <span className="text-xs font-mono text-zinc-400">
              {isRunning ? "WASM Running" : "WASM Idle"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <button
            onClick={onToggleTerminal}
            className={`flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-md text-xs font-mono border transition-all duration-200 ${isTerminalOpen ? "bg-cyber/10 border-cyber/40 text-cyber" : "bg-matte border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700"}`}
            aria-label="Toggle terminal"
          >
            <TerminalIcon size={13} />
            <span className="hidden sm:inline">Terminal</span>
          </button>

          <button
            onClick={onToggleSidebar}
            className={`hidden md:flex p-2 rounded-md border transition-all duration-200 ${isSidebarOpen ? "bg-matte border-zinc-800 text-zinc-400 hover:text-zinc-100" : "bg-amber/10 border-amber/40 text-amber"}`}
            aria-label={isSidebarOpen ? "Hide AI sidebar" : "Show AI sidebar"}
            title={isSidebarOpen ? "Hide AI sidebar" : "Show AI sidebar"}
          >
            {isSidebarOpen ? (
              <PanelRightClose size={15} />
            ) : (
              <PanelRightOpen size={15} />
            )}
          </button>

          <div className="h-5 w-px bg-zinc-800 mx-0.5 hidden md:block"></div>

          <button
            onClick={onVisualize}
            disabled={isRunning}
            className="flex items-center space-x-1.5 bg-cyber hover:bg-cyan-400 text-obsidian px-2.5 md:px-4 py-1.5 rounded-md font-medium text-xs md:text-sm transition-all duration-200 shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Play size={14} className="fill-obsidian" />
            <span className="hidden sm:inline">Visualize Code</span>
            <span className="sm:hidden">Run</span>
          </button>
        </div>
      </div>

      {onPanelChange && (
        <nav className="md:hidden flex border-t border-zinc-800/60">
          {(
            [
              { id: "editor" as const, label: "Editor", icon: Code2 },
              { id: "workspace" as const, label: "Workspace", icon: Layers },
              { id: "ai" as const, label: "AI", icon: PanelRightOpen },
            ] as const
          ).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onPanelChange(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-mono transition-colors ${
                activePanel === id
                  ? "text-cyber bg-cyber/5 border-b-2 border-cyber"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
