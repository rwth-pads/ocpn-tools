import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { AppState, AppActions, AppNode, SelectedElement } from '@/types';

import { v4 as uuidv4 } from 'uuid';

import { initialNodes } from '@/nodes';
import { initialEdges } from '@/edges';

import { initialColorSets } from '@/declarations';
import { initialVariables } from '@/declarations';
import { initialPriorities } from '@/declarations';
import { initialFunctions } from '@/declarations';

import type { PlaceNodeData } from '@/nodes/PlaceNode';
import { TransitionNodeData } from '@/nodes/TransitionNode';
import { AuxTextNodeData } from '@/nodes/AuxTextNode';

// define the initial state
const emptyState: AppState = {
  nodes: [],
  edges: [],
  colorSets: [],
  variables: [],
  priorities: [],
  functions: [],
  selectedElement: null,
}

export type StoreState = AppState & AppActions;
 
// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<StoreState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  colorSets: initialColorSets,
  variables: initialVariables,
  priorities: initialPriorities,
  functions: initialFunctions,
  selectedElement: null as SelectedElement | null,

  // Actions
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  setNodes: (nodes) => {
    set({ nodes });
  },
  setEdges: (edges) => {
    set({ edges });
  },
  setColorSets: (colorSets) => {
    set({ colorSets });
  },
  setVariables: (variables) => {
    set({ variables });
  },
  setPriorities: (priorities) => {
    set({ priorities });
  },
  setFunctions: (functions) => {
    set({ functions });
  },

  // Add a new node
  addNode: (newNode: AppNode) =>
    set((state) => ({
      nodes: [...state.nodes, newNode],
    })),

  // Add a new color set
  addColorSet: (newColorSet) =>
    set((state) => ({
      colorSets: [
        ...state.colorSets,
        { ...newColorSet, id: newColorSet.id ?? uuidv4() },
      ],
    })),
  // Add a new variable
  addVariable: (newVariable) =>
    set((state) => ({
      variables: [
        ...state.variables,
        { ...newVariable, id: newVariable.id ?? uuidv4() },
      ],
    })),
  // Add a new priority
  addPriority: (newPriority) =>
    set((state) => ({
      priorities: [
        ...state.priorities,
        { ...newPriority, id: newPriority.id ?? uuidv4() },
      ],
    })),
  // Add a new function
  addFunction: (newFunction) =>
    set((state) => ({
      functions: [
        ...state.functions,
        { ...newFunction, id: newFunction.id ?? uuidv4() },
      ],
    })),
  // Remove a color set
  deleteColorSet: (id) =>
    set((state) => ({
      colorSets: state.colorSets.filter((colorSet) => colorSet.id !== id),
    })),
  // Remove a variable
  deleteVariable: (id) =>
    set((state) => ({
      variables: state.variables.filter((variable) => variable.id !== id),
    })),
  // Remove a priority
  deletePriority: (id) =>
    set((state) => ({
      priorities: state.priorities.filter((priority) => priority.id !== id),
    })),
  // Remove a function
  deleteFunction: (id) =>
    set((state) => ({
      functions: state.functions.filter((func) => func.id !== id),
    })),

  // Update node data
  updateNodeData: (id: string, newData: PlaceNodeData | TransitionNodeData | AuxTextNodeData) => {
    set((state) => {
      const updatedNodes = state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      );

      // Update selectedElement if it matches the updated node
      const updatedSelectedElement =
        state.selectedElement?.type === 'node' && state.selectedElement.element.id === id
          ? { ...state.selectedElement, element: { ...state.selectedElement.element, data: { ...newData } } }
          : state.selectedElement;

      return {
        nodes: updatedNodes,
        selectedElement: updatedSelectedElement,
      };
    });
  },

  // Update edge data
  updateEdgeLabel: (id: string, newLabel: string) => {
    set((state) => {
      const updatedEdges = state.edges.map((edge) =>
        edge.id === id ? { ...edge, label: newLabel } : edge
      );

      // Update selectedElement if it matches the updated edge
      const updatedSelectedElement =
        state.selectedElement?.type === 'edge' && state.selectedElement.element.id === id
          ? { ...state.selectedElement, element: { ...state.selectedElement.element, label: newLabel } }
          : state.selectedElement;

      return {
        edges: updatedEdges,
        selectedElement: updatedSelectedElement,
      };
    });
  },

  setSelectedElement: (element: SelectedElement | null) => set({ selectedElement: element }),

  toggleArcMode: (state: boolean) =>
    set((store) => ({
      nodes: store.nodes.map((node) => ({
        ...node,
        data: { ...node.data, isArcMode: state },
      })),
    })),
  
  reset: () => {
    set(emptyState);
    },

}));
 
export default useStore;
