import {
  type Edge,
  type Node,
} from '@xyflow/react';
// import { PlaceNodeProps } from '@/nodes/PlaceNode'; // Import PlaceNodeData
// import { TransitionNodeProps } from '@/nodes/TransitionNode'; // Import TransitionNodeData

import type { ColorSet, Variable, Priority, Function, Use } from '@/declarations';
import { PlaceNodeData } from './nodes/PlaceNode';
import { TransitionNodeData } from './nodes/TransitionNode';
import { AuxTextNodeData } from './nodes/AuxTextNode';

// A timed token has a value and a timestamp (in milliseconds)
export interface TimedToken {
  value: unknown;
  timestamp: number; // Timestamp in milliseconds (0 = immediately available)
}

// Helper to check if a token is a timed token object
export function isTimedToken(token: unknown): token is TimedToken {
  return (
    token !== null &&
    typeof token === 'object' &&
    'value' in token &&
    'timestamp' in token &&
    typeof (token as TimedToken).timestamp === 'number'
  );
}

export type ArcType = 'normal' | 'reset' | 'inhibitor';

export type PortType = 'in' | 'out' | 'io';

export type SocketAssignment = {
  portPlaceId: string; // Place ID on the subpage
  socketPlaceId: string; // Place ID on the parent page
};

export type FusionSet = {
  id: string;
  name: string;
};

export type PetriNet = {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  selectedElement?: SelectedElement | null;
};

//export type AppNode = Node;

// Define the type for selectedElement
export type SelectedElement =
  | { type: 'node'; element: Node }
  | { type: 'edge'; element: Edge }
  | null;

export type ActiveMode = 'model' | 'simulation';

export type AppState = {
  ocpnName: string; // Top-level name for the OCPN project
  petriNetsById: Record<string, PetriNet>;
  petriNetOrder: string[]; // IDs in tab order
  activePetriNetId: string | null;
  activeMode: ActiveMode; // Whether the UI is in model editing or simulation mode
  colorSets: ColorSet[];
  variables: Variable[];
  priorities: Priority[];
  functions: Function[];
  uses: Use[];
  simulationEpoch?: string | null; // ISO 8601 date string for simulation epoch
  showMarkingDisplay: boolean; // Toggle for showing/hiding marking rectangles
  isArcMode: boolean; // Whether arc connection mode is active
  activeArcType: ArcType; // The type of arc to create when connecting nodes
  fusionSets: FusionSet[]; // Named fusion sets for fusion places
};

export type AppActions = {
  setNodes: (petriNetId: string, nodes: Node[]) => void;
  setEdges: (petriNetId: string, edges: Edge[]) => void;
  
  createPetriNet: (name: string) => void;
  addPetriNet: (newPetriNet: PetriNet) => void;
  setActivePetriNet: (id: string) => void;
  renamePetriNet: (id: string, newName: string) => void;
  deletePetriNet: (id: string) => void;
  duplicatePetriNet: (id: string) => void;
  reorderPetriNets: (newOrder: string[]) => void;
  addNode: (petriNetId: string, newNode: Node) => void;
  addEdge: (petriNetId: string, edge: Edge) => void;
  updateNode: (petriNetId: string, node: Node) => void;
  updateNodeMarking: (id: string, newMarking: unknown[]) => void;
  updateNodeData: (petriNetId: string, id: string, newData: PlaceNodeData | TransitionNodeData | AuxTextNodeData) => void;
  updateEdgeData: (petriNetId: string, id: string, newData: Record<string, unknown>) => void;
  updateEdgeLabel: (petriNetId: string, id: string, newLabel: string) => void;
  swapEdgeDirection: (petriNetId: string, id: string) => void;
  applyInitialMarkings: () => void;
  setSelectedElement: (petriNetId: string, element: SelectedElement) => void;
  
  setColorSets: (colorSets: ColorSet[]) => void;
  setVariables: (variables: Variable[]) => void;
  setPriorities: (priorities: Priority[]) => void;
  setFunctions: (functions: Function[]) => void;
  setUses: (uses: Use[]) => void;

  addColorSet: (newColorSet: ColorSet) => void;
  addVariable: (newVariable: Variable) => void;
  addPriority: (newPriority: Priority) => void;
  addFunction: (newFunction: Function) => void;
  addUse: (newUse: Use) => void;
  renameColorSet: (id: string, newName: string) => void;
  deleteColorSet: (id: string) => void;
  deleteVariable: (id: string) => void;
  deletePriority: (id: string) => void;
  deleteFunction: (id: string) => void;
  updateUse: (id: string, newUse: Use) => void;
  deleteUse: (id: string) => void;

  toggleArcMode: (state: boolean, arcType?: ArcType) => void;
  setActiveArcType: (arcType: ArcType) => void;
  setActiveMode: (mode: ActiveMode) => void;
  setOcpnName: (name: string) => void;
  setSimulationEpoch: (epoch: string | null) => void;
  setShowMarkingDisplay: (show: boolean) => void;

  // Fusion sets
  setFusionSets: (fusionSets: FusionSet[]) => void;
  addFusionSet: (fusionSet: FusionSet) => void;
  deleteFusionSet: (id: string) => void;

  // Hierarchy
  moveTransitionToSubpage: (petriNetId: string, transitionId: string) => void;
  moveNodesToSubpage: (petriNetId: string, nodeIds: string[], subpageName?: string) => void;
  flattenSubstitutionTransition: (petriNetId: string, transitionId: string) => void;
  assignSubpageToTransition: (petriNetId: string, transitionId: string, subPageId: string, socketAssignments: SocketAssignment[]) => void;
  removeSubpageFromTransition: (petriNetId: string, transitionId: string) => void;

  reset: () => void;
};


