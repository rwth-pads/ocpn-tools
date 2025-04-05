import {
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from '@xyflow/react';
import { PlaceNodeProps } from '@/nodes/PlaceNode'; // Import PlaceNodeData
import { TransitionNodeProps } from '@/nodes/TransitionNode'; // Import TransitionNodeData

import type { ColorSet, Variable, Priority } from '@/components/DeclarationManager';

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
  addNode: (newNode: AppNode) => void;
  updateNodeData: (id: string, newData: any) => void;
  setSelectedElement: (element: SelectedElement) => void; // Add setter for selectedElement
};


