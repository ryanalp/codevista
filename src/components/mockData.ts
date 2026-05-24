export type Variable = {
  id: string;
  name: string;
  type: "primitive" | "list";
  value: string | number | unknown[];
};

export type TraceFrame = {
  step: number;
  line: number;
  variables: Variable[];
};

export const mockCode = `def process_data():
    x = 10
    y = 20
    
    # Initialize array
    arr = [1, 2]
    
    # Add elements
    arr.append(3)
    arr.append(4)
    
    # Remove element
    arr.pop(2)
    
    return arr

process_data()`;

export const mockTraceData: TraceFrame[] = [
  {
    step: 1,
    line: 2,
    variables: [{ id: "x", name: "x", type: "primitive", value: 10 }],
  },
  {
    step: 2,
    line: 3,
    variables: [
      { id: "x", name: "x", type: "primitive", value: 10 },
      { id: "y", name: "y", type: "primitive", value: 20 },
    ],
  },
  {
    step: 3,
    line: 6,
    variables: [
      { id: "x", name: "x", type: "primitive", value: 10 },
      { id: "y", name: "y", type: "primitive", value: 20 },
      { id: "arr", name: "arr", type: "list", value: [1, 2] },
    ],
  },
  {
    step: 4,
    line: 9,
    variables: [
      { id: "x", name: "x", type: "primitive", value: 10 },
      { id: "y", name: "y", type: "primitive", value: 20 },
      { id: "arr", name: "arr", type: "list", value: [1, 2, 3] },
    ],
  },
  {
    step: 5,
    line: 10,
    variables: [
      { id: "x", name: "x", type: "primitive", value: 10 },
      { id: "y", name: "y", type: "primitive", value: 20 },
      { id: "arr", name: "arr", type: "list", value: [1, 2, 3, 4] },
    ],
  },
  {
    step: 6,
    line: 13,
    variables: [
      { id: "x", name: "x", type: "primitive", value: 10 },
      { id: "y", name: "y", type: "primitive", value: 20 },
      { id: "arr", name: "arr", type: "list", value: [1, 2, 4] },
    ],
  },
  {
    step: 7,
    line: 15,
    variables: [
      { id: "x", name: "x", type: "primitive", value: 10 },
      { id: "y", name: "y", type: "primitive", value: 20 },
      { id: "arr", name: "arr", type: "list", value: [1, 2, 4] },
    ],
  },
];
