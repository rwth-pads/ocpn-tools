import {
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import { PlaceNodeProps } from '@/nodes/PlaceNode'; // Import PlaceNodeData
import { TransitionNodeProps } from '@/nodes/TransitionNode'; // Import TransitionNodeData

import type { ColorSet, Variable, Priority } from '@/declarations';

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
  selectedElement: SelectedElement; // Add selectedElement to AppState
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: AppNode[]) => void;
  setEdges: (edges: Edge[]) => void;
  setColorSets: (colorSets: ColorSet[]) => void;
  setVariables: (variables: Variable[]) => void;
  setPriorities: (priorities: Priority[]) => void;
  addNode: (newNode: AppNode) => void;
  addColorSet: (newColorSet: ColorSet) => void;
  addVariable: (newVariable: Variable) => void;
  addPriority: (newPriority: Priority) => void;
  deleteColorSet: (id: string) => void;
  deleteVariable: (id: string) => void;
  deletePriority: (id: string) => void;
  updateNodeData: (id: string, newData: any) => void;
  setSelectedElement: (element: SelectedElement) => void; // Add setter for selectedElement
};


