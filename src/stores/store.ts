import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import { AppState, AppActions, PetriNet, SelectedElement } from '@/types';

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
  petriNetsById: {},
  petriNetOrder: [],
  activePetriNetId: null,
  colorSets: [],
  variables: [],
  priorities: [],
  functions: [],
}

export type StoreState = AppState & AppActions;

const initialPetriNetId = "ID6";

const initialPetriNet: PetriNet = {
  id: initialPetriNetId,
  name: "Petri Net",
  nodes: initialNodes,
  edges: initialEdges,
  selectedElement: null,
};

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<StoreState>((set) => ({
  petriNetsById: {
    [initialPetriNetId]: initialPetriNet,
  },
  petriNetOrder: [initialPetriNetId],
  activePetriNetId: initialPetriNetId,
  colorSets: initialColorSets,
  variables: initialVariables,
  priorities: initialPriorities,
  functions: initialFunctions,

  // Actions
  setNodes: (petriNetId: string, nodes: Node[]) => {
    set((state) => ({
      petriNetsById: {
        ...state.petriNetsById,
        [petriNetId]: {
          ...state.petriNetsById[petriNetId],
          nodes,
        },
      },
    }));
  },
  setEdges: (petriNetId: string, edges: Edge[]) => {
    set((state) => ({
      petriNetsById: {
        ...state.petriNetsById,
        [petriNetId]: {
          ...state.petriNetsById[petriNetId],
          edges,
        },
      },
    }));
  },

  // Create a new Petri net
  createPetriNet: (name: string) => {
    const newPetriNetId = uuidv4();
    const newPetriNet: PetriNet = {
      id: newPetriNetId,
      name,
      nodes: [],
      edges: [],
      selectedElement: null,
    };
    set((state) => ({
      petriNetsById: {
        ...state.petriNetsById,
        [newPetriNetId]: newPetriNet,
      },
      petriNetOrder: [...state.petriNetOrder, newPetriNetId],
      activePetriNetId: newPetriNetId,
    }));
  },
  // Add a new Petri net
  addPetriNet: (newPetriNet: PetriNet) => {
    set((state) => ({
      petriNetsById: {
        ...state.petriNetsById,
        [newPetriNet.id]: {
          ...newPetriNet,
          selectedElement: null,
        },
      },
      petriNetOrder: [...state.petriNetOrder, newPetriNet.id],
      activePetriNetId: newPetriNet.id,
    }));
  },
  setActivePetriNet: (id) => {
    set((state) => ({
      activePetriNetId: id,
      petriNetsById: {
        ...state.petriNetsById,
        [id]: {
          ...state.petriNetsById[id],
          selectedElement: null,
        },
      },
    }));
  },

  // Add a new node to a petri net
  addNode: (petriNetId: string, newNode: Node) => {
    set((state) => {
      const petriNet = state.petriNetsById[petriNetId];
      const updatedNodes = [...petriNet.nodes, { ...newNode, id: newNode.id ?? uuidv4() }];
      return {
        petriNetsById: {
          ...state.petriNetsById,
          [petriNetId]: {
            ...petriNet,
            nodes: updatedNodes,
          },
        },
      };
    });
  },
  // Add a new edge to a petri net
  addEdge: (petriNetId: string, edge: Edge) => {
    set((state) => {
      const petriNet = state.petriNetsById[petriNetId];
      const updatedEdges = [...petriNet.edges, { ...edge, id: edge.id ?? uuidv4() }];
      return {
        petriNetsById: {
          ...state.petriNetsById,
          [petriNetId]: {
            ...petriNet,
            edges: updatedEdges,
          },
        },
      };
    });
  },
  // Update node
  updateNode: (petriNetId: string, node: Node) => {
    set((state) => {
      const petriNet = state.petriNetsById[petriNetId];
      const updatedNodes = petriNet.nodes.map((n) => (n.id === node.id ? { ...node } : n));
      return {
        petriNetsById: {
          ...state.petriNetsById,
          [petriNetId]: {
            ...petriNet,
            nodes: updatedNodes,
          },
        },
      };
    });
  },
  // Update node data
  updateNodeData: (petriNetId, id: string, newData: PlaceNodeData | TransitionNodeData | AuxTextNodeData) => {
    set((state) => {
      const petriNet = state.petriNetsById[petriNetId];
      const updatedNodes = petriNet.nodes.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      );

      // Update selectedElement if it matches the updated node
      const updatedSelectedElement =
      petriNet.selectedElement?.type === 'node' && petriNet.selectedElement.element.id === id
        ? { ...petriNet.selectedElement, element: { ...petriNet.selectedElement.element, data: { ...newData } } }
        : petriNet.selectedElement;

      return {
      petriNetsById: {
        ...state.petriNetsById,
        [petriNetId]: {
        ...petriNet,
        nodes: updatedNodes,
        selectedElement: updatedSelectedElement,
        },
      },
      };
    });
  },
  // Update edge data
  updateEdgeLabel: (petriNetId: string, id: string, newLabel: string) => {
    set((state) => {
      const petriNet = state.petriNetsById[petriNetId];
      const updatedEdges = petriNet.edges.map((edge) =>
        edge.id === id ? { ...edge, label: newLabel } : edge
      );

      // Update selectedElement if it matches the updated edge
      const updatedSelectedElement =
        petriNet.selectedElement?.type === 'edge' && petriNet.selectedElement.element.id === id
          ? { ...petriNet.selectedElement, element: { ...petriNet.selectedElement.element, label: newLabel } }
          : petriNet.selectedElement;

      return {
        petriNetsById: {
          ...state.petriNetsById,
          [petriNetId]: {
            ...petriNet,
            edges: updatedEdges,
            selectedElement: updatedSelectedElement,
          },
        },
      };
    });
  },

  setSelectedElement: (petriNetId: string, element: SelectedElement | null) =>
    set((state) => ({
      petriNetsById: {
        ...state.petriNetsById,
        [petriNetId]: {
          ...state.petriNetsById[petriNetId],
          selectedElement: element,
        },
      },
    })),

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

  toggleArcMode: (state: boolean) =>
  set((store) => ({
    petriNetsById: Object.fromEntries(
      Object.entries(store.petriNetsById).map(([petriNetId, petriNet]) => [
        petriNetId,
        {
          ...petriNet,
          nodes: petriNet.nodes.map((node) => ({
            ...node,
            data: { ...node.data, isArcMode: state },
          })),
        },
      ])
    ),
  })),

  reset: () => {
    set(emptyState);
  },

}));

export default useStore;
