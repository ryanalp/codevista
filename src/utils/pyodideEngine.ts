import type { TraceFrame, TraceResult } from "@/components/mockData";

const PYODIDE_VERSION = "0.25.0";
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;
const PYODIDE_SCRIPT = `${PYODIDE_CDN}/pyodide.js`;
const USER_CODE_FILENAME = "<user_code>";

interface PyodideInterface {
  runPython: (code: string) => unknown;
  globals: {
    set: (name: string, value: unknown) => void;
    delete: (name: string) => void;
  };
}

declare global {
  interface Window {
    loadPyodide?: (config?: { indexURL?: string }) => Promise<PyodideInterface>;
  }
}

let pyodideLoadPromise: Promise<PyodideInterface> | null = null;

function loadPyodideScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Pyodide can only be loaded in the browser"),
    );
  }

  if (window.loadPyodide) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-pyodide="${PYODIDE_VERSION}"]`,
    );
    if (existing) {
      if (window.loadPyodide) {
        resolve();
        return;
      }
      existing.remove();
    }

    const script = document.createElement("script");
    script.src = PYODIDE_SCRIPT;
    script.async = true;
    script.dataset.pyodide = PYODIDE_VERSION;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      reject(new Error(`Failed to load Pyodide from ${PYODIDE_SCRIPT}`));
    };
    document.head.appendChild(script);
  });
}

function loadPyodideInstance(): Promise<PyodideInterface> {
  return (async () => {
    await loadPyodideScript();
    if (!window.loadPyodide) {
      throw new Error("loadPyodide is not available on window");
    }
    return window.loadPyodide({ indexURL: `${PYODIDE_CDN}/` });
  })();
}

async function getPyodide(): Promise<PyodideInterface> {
  if (!pyodideLoadPromise) {
    pyodideLoadPromise = loadPyodideInstance().catch((error) => {
      pyodideLoadPromise = null;
      throw error;
    });
  }
  return pyodideLoadPromise;
}

const TRACE_RUNNER = `
import json
import sys

USER_FILENAME = ${JSON.stringify(USER_CODE_FILENAME)}
_trace_frames = []
_step = 0
_stdout_buffer = []


class _CapturingStdout:
    def write(self, text):
        if text:
            _stdout_buffer.append(text)

    def flush(self):
        pass


def _serialize_value(val):
    if isinstance(val, bool):
        return val, "primitive"
    if isinstance(val, (int, float, str)):
        return val, "primitive"
    if isinstance(val, (list, tuple)):
        items = []
        for item in val:
            serialized, item_type = _serialize_value(item)
            if item_type == "primitive":
                items.append(serialized)
            elif item_type == "list":
                items.append(serialized)
            else:
                items.append(str(serialized))
        return items, "list"
    if val is None:
        return "None", "primitive"
    try:
        return repr(val), "primitive"
    except Exception:
        return str(val), "primitive"


def _locals_to_variables(frame):
    variables = []
    for name in sorted(frame.f_locals.keys()):
        if name.startswith("_"):
            continue
        value = frame.f_locals[name]
        serialized, var_type = _serialize_value(value)
        if serialized is None and var_type == "primitive":
            continue
        variables.append(
            {
                "id": name,
                "name": name,
                "type": var_type,
                "value": serialized,
            }
        )
    return variables


def _trace(frame, event, arg):
    global _step
    if event != "line":
        return _trace
    if frame.f_code.co_filename != USER_FILENAME:
        return _trace

    current_stdout = "".join(_stdout_buffer)
    if _trace_frames:
        _trace_frames[-1]["stdout"] = current_stdout

    _step += 1
    _trace_frames.append(
        {
            "step": _step,
            "line": frame.f_lineno,
            "variables": _locals_to_variables(frame),
            "stdout": current_stdout,
        }
    )
    return _trace


def _run_traced_user_code(source):
    global _trace_frames, _step, _stdout_buffer
    _trace_frames = []
    _step = 0
    _stdout_buffer = []
    code = compile(source, USER_FILENAME, "exec")
    namespace = {"__name__": "__main__"}
    original_stdout = sys.stdout
    sys.stdout = _CapturingStdout()
    sys.settrace(_trace)
    try:
        exec(code, namespace, namespace)
    finally:
        sys.settrace(None)
        sys.stdout = original_stdout

    full_stdout = "".join(_stdout_buffer)
    if _trace_frames:
        _trace_frames[-1]["stdout"] = full_stdout

    return {
        "frames": _trace_frames,
        "stdout": full_stdout,
    }


_result = _run_traced_user_code(USER_CODE)
json.dumps(_result)
`;

function parseTraceFrames(raw: unknown): TraceResult {
  if (typeof raw !== "string") {
    throw new Error("Pyodide trace runner did not return JSON");
  }

  const parsed: unknown = JSON.parse(raw);

  let framesRaw: unknown[];
  let stdout = "";

  if (Array.isArray(parsed)) {
    framesRaw = parsed;
  } else if (
    typeof parsed === "object" &&
    parsed !== null &&
    "frames" in parsed
  ) {
    const result = parsed as { frames: unknown; stdout?: unknown };
    if (!Array.isArray(result.frames)) {
      throw new Error("Trace output frames is not an array");
    }
    framesRaw = result.frames;
    stdout = typeof result.stdout === "string" ? result.stdout : "";
  } else {
    throw new Error("Trace output is not a valid trace result");
  }

  const frames = framesRaw.map((frame, index) => {
    if (
      typeof frame !== "object" ||
      frame === null ||
      !("step" in frame) ||
      !("line" in frame) ||
      !("variables" in frame)
    ) {
      throw new Error(`Invalid trace frame at index ${index}`);
    }

    const { step, line, variables, stdout: frameStdout } = frame as {
      step: unknown;
      line: unknown;
      variables: unknown;
      stdout?: unknown;
    };

    if (
      typeof step !== "number" ||
      typeof line !== "number" ||
      !Array.isArray(variables)
    ) {
      throw new Error(`Invalid trace frame shape at index ${index}`);
    }

    return {
      step,
      line,
      stdout: typeof frameStdout === "string" ? frameStdout : undefined,
      variables: variables.map((variable, varIndex) => {
        if (
          typeof variable !== "object" ||
          variable === null ||
          !("id" in variable) ||
          !("name" in variable) ||
          !("type" in variable) ||
          !("value" in variable)
        ) {
          throw new Error(
            `Invalid variable at frame ${index}, variable ${varIndex}`,
          );
        }

        const { id, name, type, value } = variable as {
          id: unknown;
          name: unknown;
          type: unknown;
          value: unknown;
        };

        if (
          typeof id !== "string" ||
          typeof name !== "string" ||
          (type !== "primitive" && type !== "list")
        ) {
          throw new Error(
            `Invalid variable metadata at frame ${index}, variable ${varIndex}`,
          );
        }

        if (type === "primitive") {
          if (
            typeof value !== "string" &&
            typeof value !== "number" &&
            value !== null
          ) {
            throw new Error(
              `Invalid primitive value at frame ${index}, variable ${varIndex}`,
            );
          }
          return {
            id,
            name,
            type: "primitive" as const,
            value: value === null ? "None" : value,
          };
        }

        if (!Array.isArray(value)) {
          throw new Error(
            `Invalid list value at frame ${index}, variable ${varIndex}`,
          );
        }

        return {
          id,
          name,
          type: "list" as const,
          value,
        };
      }),
    };
  });

  if (!stdout && frames.length > 0) {
    const lastFrame = frames[frames.length - 1];
    stdout = lastFrame.stdout ?? "";
  }

  return { frames, stdout };
}

/**
 * Loads Pyodide from the official CDN and executes user Python with
 * sys.settrace(), capturing frame.f_locals on every line event.
 */
export async function executePythonTrace(
  userCode: string,
): Promise<TraceResult> {
  if (!userCode.trim()) {
    throw new Error("No Python code to execute");
  }

  const pyodide = await getPyodide();

  pyodide.globals.set("USER_CODE", userCode);

  let rawResult: unknown;
  try {
    rawResult = pyodide.runPython(TRACE_RUNNER);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Python execution failed";
    throw new Error(message);
  } finally {
    pyodide.globals.delete("USER_CODE");
  }

  return parseTraceFrames(rawResult);
}
