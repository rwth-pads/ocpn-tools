import { create } from 'zustand';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import { AppState, AppNode, SelectedElement } from '@/types';
 
import { initialNodes } from '@/nodes';
import { initialEdges } from '@/edges';

import { initialColorSets } from '@/declarations';
import { initialVariables } from '@/declarations';
import { initialPriorities } from '@/declarations';

import { v4 as uuidv4 } from 'uuid';
 
// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<AppState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  colorSets: initialColorSets,
  variables: initialVariables,
  priorities: initialPriorities,
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

  // Update node data
  updateNodeData: (id: string, newData: any) => {
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

  setSelectedElement: (element) => set({ selectedElement: element }),

  toggleArcMode: (state) =>
    set((store) => ({
      nodes: store.nodes.map((node) => ({
        ...node,
        data: { ...node.data, isArcMode: state },
      })),
    })),
}));
 
export default useStore;
