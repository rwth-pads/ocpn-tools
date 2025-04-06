import {
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import { PlaceNodeProps } from '@/nodes/PlaceNode'; // Import PlaceNodeData
import { TransitionNodeProps } from '@/nodes/TransitionNode'; // Import TransitionNodeData

import type { ColorSet, Variable, Priority, Function } from '@/declarations';

export type AppNode = Node;

// Define the type for selectedElement
export type SelectedElement =
  | { type: 'node'; element: PlaceNodeProps & { type: string } | TransitionNodeProps & { type: string } }
  | { type: 'edge'; element: Edge & { type: string } }
  | null;

export type AppState = {
  nodes: AppNode[];
  edges: Edge[];
  colorSets: ColorSet[];
  variables: Variable[];
  priorities: Priority[];
  functions: Function[];
  selectedElement: SelectedElement; // Add selectedElement to AppState
};

export type AppActions = {
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setColorSets: (colorSets: ColorSet[]) => void;
  setVariables: (variables: Variable[]) => void;
  setPriorities: (priorities: Priority[]) => void;
  setFunctions: (functions: Function[]) => void;
  addNode: (newNode: AppNode) => void;
  addColorSet: (newColorSet: ColorSet) => void;
  addVariable: (newVariable: Variable) => void;
  addPriority: (newPriority: Priority) => void;
  addFunction: (newFunction: Function) => void;
  deleteColorSet: (id: string) => void;
  deleteVariable: (id: string) => void;
  deletePriority: (id: string) => void;
  deleteFunction: (id: string) => void;
  updateNodeData: (id: string, newData: any) => void;
  setSelectedElement: (element: SelectedElement) => void;
  reset: () => void;
};


