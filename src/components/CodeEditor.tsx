"use client";

import { useEffect, useRef } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { FileCode2 } from "lucide-react";

function defineCineNoirTheme(monaco: Monaco) {
  monaco.editor.defineTheme("cineNoir", {
    base: "vs-dark",
    inherit: true,
    rules: [
      {
        token: "comment",
        foreground: "52525b",
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
        foreground: "f4f4f5",
      },
    ],
    colors: {
      "editor.background": "#121214",
      "editor.foreground": "#f4f4f5",
      "editor.lineHighlightBackground": "#1e1e24",
      "editorLineNumber.foreground": "#52525b",
      "editorLineNumber.activeForeground": "#a1a1aa",
      "editorIndentGuide.background": "#27272a",
      "editorGutter.background": "#121214",
      "editorWidget.background": "#121214",
      "editor.selectionBackground": "#06b6d433",
      "editor.inactiveSelectionBackground": "#06b6d422",
    },
  });
}

interface CodeEditorProps {
  code: string;
  activeLine: number | null;
  onChange: (value: string | undefined) => void;
}

export function CodeEditor({ code, activeLine, onChange }: CodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleBeforeMount = (monaco: Monaco) => {
    monacoRef.current = monaco;
    defineCineNoirTheme(monaco);
  };

  const handleEditorDidMount = (
    editorInstance: editor.IStandaloneCodeEditor,
    monaco: Monaco,
  ) => {
    editorRef.current = editorInstance;
    monacoRef.current = monaco;
    monaco.editor.setTheme("cineNoir");
  };

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
    <div className="flex flex-col h-full bg-matte border border-zinc-800 rounded-md overflow-hidden m-3 mt-0">
      <div className="flex items-center h-10 bg-[#0D0D0F] border-b border-zinc-800 px-2 shrink-0">
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-matte border-t border-x border-zinc-800 rounded-t-md border-t-cyber">
          <FileCode2 size={14} className="text-cyber" />
          <span className="text-xs font-mono text-zinc-100">main.py</span>
        </div>
      </div>
      <div className="flex-1 relative bg-matte">
        <Editor
          height="100%"
          theme="cineNoir"
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
            fontSize: 14,
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
