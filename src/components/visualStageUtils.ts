// ─── Types ────────────────────────────────────────────────────────────────────

export interface TraceVariable {
  id: string;
  name: string;
  type: "primitive" | "list" | "dict";
  value: any;
}

export interface TraceFrame {
  step: number;
  line: number;
  variables: TraceVariable[];
  stdout?: string;
}

export interface ParsedNodeLink {
  data: string;
  hasNext: boolean;
  nextData: string | null;
  repr: string;
}

// ─── Linked-list detectors ─────────────────────────────────────────────────────

export function isNodeRepr(value: unknown): value is string {
  return typeof value === "string" && /Node\s*\(/i.test(value);
}

export function isLinkedListContainer(variable: TraceVariable): boolean {
  if (variable.name === "self") return true;
  const text = String(variable.value);
  return text === "LinkedList" || /LinkedList\s*\(/i.test(text);
}

export function hasLinkedListStructure(variables: TraceVariable[]): boolean {
  const hasContainer = variables.some(isLinkedListContainer);
  const hasNodes = variables.some((v) => isNodeRepr(v.value));
  const hasHeadPointer = variables.some((v) => v.name === "head");
  return (hasContainer && hasNodes) || (hasNodes && hasHeadPointer);
}

// ─── Node parsing helpers ──────────────────────────────────────────────────────

export function extractBalancedNodeExpr(text: string, startIndex: number): string {
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

export function parseNodeData(repr: string): string | null {
  return repr.match(/data:\s*([^,)]+)/i)?.[1]?.trim() ?? null;
}

export function parseNodeLink(repr: string): ParsedNodeLink | null {
  const data = parseNodeData(repr);
  if (!data) return null;

  const nextMatch = repr.match(/next\s*[=:]\s*([\s\S]+)$/i);
  const nextRaw = nextMatch?.[1]?.trim() ?? "";

  const pointsToNone = /^(None|False)\b/i.test(nextRaw);
  const nestedNode = /Node\s*\(/i.test(nextRaw);
  const pointsToTrue = /^True\b/i.test(nextRaw);
  const nestedData = nestedNode
    ? parseNodeData(extractBalancedNodeExpr(nextRaw, 0))
    : null;

  return {
    data,
    hasNext: !pointsToNone && (nestedNode || pointsToTrue),
    nextData: nestedData,
    repr,
  };
}

// ─── Chain builders ────────────────────────────────────────────────────────────

export function walkNestedNodeChain(repr: string): string[] {
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

export function followChainByPointers(
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

export function buildGlobalLinkedListChain(variables: TraceVariable[]): string[] {
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

  const deeplyNested = parsedNodes.find((n) =>
    /next\s*[=:]\s*Node\s*\(/i.test(n.repr),
  );
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
