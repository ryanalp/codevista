"use client";

import { useEffect, useRef } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { FileCode2 } from "lucide-react";

function defineCineNoirThemes(monaco: Monaco) {
  monaco.editor.defineTheme("cineNoirDark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      {
        token: "comment",
        foreground: "71717a",
        fontStyle: "italic",
      },
      {
        token: "keyword",
        foreground: "06b6d4",
      },
      {
        token: "string",
        foreground: "f59e0b",
      },
      {
        token: "number",
        foreground: "e4e4e7",
      },
    ],
    colors: {
      "editor.background": "#1a1a2e",
      "editor.foreground": "#f4f4f5",
      "editor.lineHighlightBackground": "#27273f",
      "editorLineNumber.foreground": "#52525b",
      "editorLineNumber.activeForeground": "#a1a1aa",
      "editorIndentGuide.background": "#27273f",
      "editorGutter.background": "#1a1a2e",
      "editorWidget.background": "#1a1a2e",
      "editor.selectionBackground": "#06b6d433",
      "editor.inactiveSelectionBackground": "#06b6d422",
    },
  });

  monaco.editor.defineTheme("cineNoirLight", {
    base: "vs",
    inherit: true,
    rules: [
      {
        token: "comment",
        foreground: "64748b",
        fontStyle: "italic",
      },
      {
        token: "keyword",
        foreground: "0284c7",
      },
      {
        token: "string",
        foreground: "b45309",
      },
      {
        token: "number",
        foreground: "0f172a",
      },
    ],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#0f172a",
      "editor.lineHighlightBackground": "#f1f5f9",
      "editorLineNumber.foreground": "#94a3b8",
      "editorLineNumber.activeForeground": "#475569",
      "editorIndentGuide.background": "#cbd5e1",
      "editorGutter.background": "#ffffff",
      "editorWidget.background": "#ffffff",
      "editor.selectionBackground": "#0284c722",
      "editor.inactiveSelectionBackground": "#0284c711",
    },
  });
}

interface CodeEditorProps {
  code: string;
  activeLine: number | null;
  onChange: (value: string | undefined) => void;
  theme?: "light" | "dark";
}

export function CodeEditor({ code, activeLine, onChange, theme = "dark" }: CodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleBeforeMount = (monaco: Monaco) => {
    monacoRef.current = monaco;
    defineCineNoirThemes(monaco);
  };

  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => {
    editorRef.current = editorInstance;
    monacoRef.current = monaco;
    monaco.editor.setTheme(theme === "dark" ? "cineNoirDark" : "cineNoirLight");
  };

  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(theme === "dark" ? "cineNoirDark" : "cineNoirLight");
    }
  }, [theme]);

  useEffect(() => {
    const monaco = monacoRef.current;
    if (editorRef.current && monaco && activeLine !== null) {
      decorationsRef.current = editorRef.current.deltaDecorations(
        decorationsRef.current,
        [
          {
            range: new monaco.Range(activeLine, 1, activeLine, 1),
            options: {
              isWholeLine: true,
              className: "active-line-highlight",
            },
          },
        ],
      );
      editorRef.current.revealLineInCenterIfOutsideViewport(activeLine);
    } else if (editorRef.current && activeLine === null) {
      decorationsRef.current = editorRef.current.deltaDecorations(
        decorationsRef.current,
        [],
      );
    }
  }, [activeLine]);

  return (
    <div className="flex flex-col h-full bg-matte border border-zinc-800 rounded-md overflow-hidden m-2 md:m-3 mt-0">
      <div className="flex items-center h-10 bg-obsidian border-b border-zinc-800 px-2 shrink-0">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-matte border-t border-x border-zinc-800 rounded-t-md border-t-cyber">
          <FileCode2 size={14} className="text-cyber" />
          <span className="text-xs font-mono text-zinc-100">main.py</span>
        </div>
      </div>
      <div className="flex-1 relative bg-matte">
        <Editor
          height="100%"
          theme={theme === "dark" ? "cineNoirDark" : "cineNoirLight"}
          defaultLanguage="python"
          value={code}
          onChange={onChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorDidMount}
          loading={
            <div className="h-full w-full bg-matte flex items-center justify-center">
              <span className="text-xs font-mono text-zinc-500">
                Loading editor…
              </span>
            </div>
          }
          options={{
            minimap: {
              enabled: false,
            },
            fontSize: 13,
            fontFamily: "'JetBrains Mono', monospace",
            padding: {
              top: 16,
            },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
          }}
        />
      </div>
    </div>
  );
}
