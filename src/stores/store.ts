import { create } from 'zustand';
import { temporal } from 'zundo';
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
import type { ArcType } from '@/types';

// define the initial state
const emptyState: AppState = {
  petriNetsById: {},
  petriNetOrder: [],
  activePetriNetId: null,
  colorSets: [],
  variables: [],
  priorities: [],
  functions: [],
  uses: [],
  simulationEpoch: null,
  showMarkingDisplay: true,
  isArcMode: false,
  activeArcType: 'normal' as ArcType,
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

// --- Undo batching state (module-level, used by handleSet) ---
let _undoBatchDepth = 0;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _undoBatchFirstState: any = undefined;
let _undoBatchReplace: boolean | undefined;
// Reference to the real handleSet so endBatch can flush
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _realHandleSet: ((state: any, replace: any) => void) | undefined;

// Helper to strip transient fields from petri nets for undo tracking
const stripTransientPetriNetFields = (petriNetsById: Record<string, PetriNet>) => {
  const result: Record<string, { id: string; name: string; nodes: { id: string; type?: string; position: { x: number; y: number }; data: Record<string, unknown> }[]; edges: { id: string; source: string; target: string; label?: unknown; data?: Record<string, unknown> }[] }> = {};
  for (const [id, pn] of Object.entries(petriNetsById)) {
    result[id] = {
      id: pn.id,
      name: pn.name,
      nodes: pn.nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data as Record<string, unknown>,
      })),
      edges: pn.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        data: e.data as Record<string, unknown> | undefined,
      })),
    };
  }
  return result;
};

// this is our useStore hook that we can use in our components to get parts of the store and call actions
const useStore = create<StoreState>()(temporal((set) => ({
  petriNetsById: {
    [initialPetriNetId]: initialPetriNet,
  },
  petriNetOrder: [initialPetriNetId],
  activePetriNetId: initialPetriNetId,
  colorSets: initialColorSets,
  variables: initialVariables,
  priorities: initialPriorities,
  functions: initialFunctions,
  uses: [],
  simulationEpoch: null,
  showMarkingDisplay: true,
  isArcMode: false,
  activeArcType: 'normal' as ArcType,

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
  renamePetriNet: (id: string, newName: string) => {
    set((state) => ({
      petriNetsById: {
        ...state.petriNetsById,
        [id]: {
          ...state.petriNetsById[id],
          name: newName,
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
  updateNodeMarking: (id: string, newMarking: unknown[]) => {
    set((state) => {
      const petriNet = state.petriNetsById[state.activePetriNetId!];
      const updatedNodes = petriNet.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, marking: newMarking } } : node
      );
      return {
        petriNetsById: {
          ...state.petriNetsById,
          [state.activePetriNetId!]: {
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
      
      // Mapping from parent node properties to inscription types
      const propertyToInscriptionType: Record<string, string> = {
        initialMarking: 'initialMarking',
        colorSet: 'colorSet',
        guard: 'guard',
        time: 'time',
        priority: 'priority',
        codeSegment: 'codeSegment',
      };
      
      // First pass: update the target node
      let updatedNodes = petriNet.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      );
      
      // Second pass: update any child inscription nodes whose labels should reflect parent data
      updatedNodes = updatedNodes.map((node) => {
        // Check if this is an inscription node that is a child of the updated node
        if (node.type === 'inscription' && node.parentId === id) {
          const inscriptionType = node.data?.inscriptionType as string;
          // Find which parent property this inscription type maps to
          const parentProperty = Object.entries(propertyToInscriptionType).find(
            ([, insType]) => insType === inscriptionType
          )?.[0];
          
          if (parentProperty && parentProperty in newData) {
            // Update the inscription label to match the new parent property value
            // Cast through unknown to satisfy TypeScript
            const newLabel = (newData as unknown as Record<string, string>)[parentProperty];
            return {
              ...node,
              data: {
                ...node.data,
                label: newLabel || '',
              },
            };
          }
        }
        return node;
      });

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
  updateEdgeData: (petriNetId: string, id: string, newData: Record<string, unknown>) => {
    set((state) => {
      const petriNet = state.petriNetsById[petriNetId];
      const updatedEdges = petriNet.edges.map((edge) =>
        edge.id === id ? { ...edge, data: { ...edge.data, ...newData } } : edge
      );

      // Update selectedElement if it matches the updated edge
      const updatedSelectedElement =
        petriNet.selectedElement?.type === 'edge' && petriNet.selectedElement.element.id === id
          ? { ...petriNet.selectedElement, element: { ...petriNet.selectedElement.element, data: { ...petriNet.selectedElement.element.data, ...newData } } }
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
  // Update edge label
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

  // Swap edge source and target (reverse direction)
  swapEdgeDirection: (petriNetId: string, id: string) => {
    set((state) => {
      const petriNet = state.petriNetsById[petriNetId];
      const updatedEdges = petriNet.edges.map((edge) =>
        edge.id === id 
          ? { ...edge, source: edge.target, target: edge.source } 
          : edge
      );

      // Update selectedElement if it matches the updated edge
      const currentEdge = petriNet.edges.find(e => e.id === id);
      const updatedSelectedElement =
        petriNet.selectedElement?.type === 'edge' && petriNet.selectedElement.element.id === id && currentEdge
          ? { 
              ...petriNet.selectedElement, 
              element: { 
                ...petriNet.selectedElement.element, 
                source: currentEdge.target, 
                target: currentEdge.source 
              } 
            }
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

  // Set marking = initialMarking for all places in the store
  applyInitialMarkings: () => {
    set((state) => {
      const petriNet = state.petriNetsById[state.activePetriNetId!];
      const updatedNodes = petriNet.nodes.map((node) => {
        if (node.type === 'place') {
          let marking: (string | number | null)[] = []; // Include null for unit tokens
          if (node.data.initialMarking) {
            try {
              if (typeof node.data.initialMarking === 'string' && node.data.initialMarking.trim() !== '') {
                let parsedMarking: (string | number | null)[] = []; // Include null for unit tokens
                
                // Check for UNIT type marking: [(), (), ...]
                const unitMatch = node.data.initialMarking.match(/^\s*\[\s*((?:\(\)\s*,?\s*)*)\s*\]\s*$/);
                if (unitMatch) {
                  // Count the number of () in the array
                  const unitCount = (node.data.initialMarking.match(/\(\)/g) || []).length;
                  // Create array of null values to represent unit tokens
                  parsedMarking = Array(unitCount).fill(null);
                } else if (node.data.initialMarking.endsWith('.all()')) {
                  const colorSetName = node.data.initialMarking.substring(0, node.data.initialMarking.length - '.all()'.length).trim();
                  const colorSet = state.colorSets.find(cs => cs.name === colorSetName);

                  if (colorSet && colorSet.definition.includes('int')) {
                    const rangeMatch = colorSet.definition.match(/with\s+(\d+)\.\.(\d+);/);
                    if (rangeMatch) {
                      const start = parseInt(rangeMatch[1], 10);
                      const end = parseInt(rangeMatch[2], 10);
                      if (!isNaN(start) && !isNaN(end)) {
                        // Generate array from start to end (inclusive)
                        parsedMarking = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                      } else {
                        console.warn(`Invalid range values in color set definition: "${colorSet.definition}"`);
                      }
                    } else {
                      console.warn(`No valid range found in color set definition: "${colorSet.definition}"`);
                    }
                  } else {
                    console.warn(`Cannot apply '.all()' to color set "${colorSetName}". It's either not found, not a 'basic' type, or doesn't contain 'int' in its definition.`);
                    parsedMarking = []; // Default to empty if conditions aren't met
                  }
                } else {
                  // Attempt to parse as JSON for other cases
                  const parsed = JSON.parse(node.data.initialMarking);
                  // Ensure result is an array
                  if (Array.isArray(parsed)) {
                    parsedMarking = parsed;
                  } else {
                    // Single value - wrap in array
                    parsedMarking = [parsed];
                  }
                }
                marking = parsedMarking;
              }
            } catch (error) {
              console.error(`Error parsing initial marking for node ${node.id}:`, node.data.initialMarking, error);
              marking = []; // Default to empty on error
            }
          }
          // Ensure data retains other properties and update marking
          return {
            ...node,
            data: { ...node.data, marking },
          };
        }
        return node;
      });
      return {
        petriNetsById: {
          ...state.petriNetsById,
          [state.activePetriNetId!]: {
            ...petriNet,
            nodes: updatedNodes,
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
  setUses: (uses) => {
    set({ uses });
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
  // Rename a color set and update all references (places, variables)
  renameColorSet: (id: string, newName: string) =>
  set((state) => {
    // Find the old name
    const colorSet = state.colorSets.find((cs) => cs.id === id);
    if (!colorSet) return state;
    
    const oldName = colorSet.name;
    if (oldName === newName) return state; // No change needed
    
    // Update the color set name
    const updatedColorSets = state.colorSets.map((cs) =>
      cs.id === id ? { ...cs, name: newName } : cs
    );
    
    // Update all variables that reference this color set
    const updatedVariables = state.variables.map((v) =>
      v.colorSet === oldName ? { ...v, colorSet: newName } : v
    );
    
    // Update all places in all Petri nets that reference this color set
    const updatedPetriNetsById: typeof state.petriNetsById = {};
    for (const [netId, petriNet] of Object.entries(state.petriNetsById)) {
      const updatedNodes = petriNet.nodes.map((node) => {
        if (node.type === 'place' && node.data?.colorSet === oldName) {
          return {
            ...node,
            data: { ...node.data, colorSet: newName },
          };
        }
        return node;
      });
      updatedPetriNetsById[netId] = {
        ...petriNet,
        nodes: updatedNodes,
      };
    }
    
    return {
      colorSets: updatedColorSets,
      variables: updatedVariables,
      petriNetsById: updatedPetriNetsById,
    };
  }),
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

  // Add a new use
  addUse: (newUse) =>
  set((state) => ({
    uses: [
      ...state.uses,
      { ...newUse, id: newUse.id ?? uuidv4() },
    ],
  })),
  // Update a use
  updateUse: (id, newUse) =>
  set((state) => ({
    uses: state.uses.map((use) =>
      use.id === id ? { name: newUse.name, content: newUse.content } : use
    ),
  })),
  // Remove a use
  deleteUse: (id) =>
  set((state) => ({
    uses: state.uses.filter((use) => use.id !== id),
  })),

  toggleArcMode: (state: boolean, arcType?: ArcType) =>
  set((store) => ({
    isArcMode: state,
    activeArcType: arcType || store.activeArcType,
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

  setActiveArcType: (arcType: ArcType) =>
  set(() => ({
    activeArcType: arcType,
  })),

  setSimulationEpoch: (epoch: string | null) =>
    set(() => ({
      simulationEpoch: epoch,
    })),

  setShowMarkingDisplay: (show: boolean) =>
    set(() => ({
      showMarkingDisplay: show,
    })),

  reset: () => {
    set(emptyState);
  },

}),
  {
    handleSet: (handleSet) => {
      // Capture the real handleSet so endBatch can flush
      _realHandleSet = handleSet;
      // Flag-based batching: when _undoBatchDepth > 0, we hold the
      // first pastState and only push it when the batch ends.
      return (pastState, replace) => {
        if (_undoBatchDepth > 0) {
          // Inside a batch — capture the first "before" state only
          if (!_undoBatchFirstState) {
            _undoBatchFirstState = pastState;
            _undoBatchReplace = replace;
          }
          // Discard intermediate states
          return;
        }
        // Not in a batch — record normally
        handleSet(pastState, replace);
      };
    },
    partialize: (state) => ({
      petriNetsById: state.petriNetsById,
      petriNetOrder: state.petriNetOrder,
      activePetriNetId: state.activePetriNetId,
      colorSets: state.colorSets,
      variables: state.variables,
      priorities: state.priorities,
      functions: state.functions,
      uses: state.uses,
    }),
    equality: (pastState, currentState) => {
      // Compare serialized snapshots to avoid recording no-op changes
      // (e.g. selection changes, node measured events)
      return JSON.stringify({
        petriNetsById: stripTransientPetriNetFields(pastState.petriNetsById as Record<string, PetriNet>),
        petriNetOrder: pastState.petriNetOrder,
        activePetriNetId: pastState.activePetriNetId,
        colorSets: pastState.colorSets,
        variables: pastState.variables,
        priorities: pastState.priorities,
        functions: pastState.functions,
        uses: pastState.uses,
      }) === JSON.stringify({
        petriNetsById: stripTransientPetriNetFields(currentState.petriNetsById as Record<string, PetriNet>),
        petriNetOrder: currentState.petriNetOrder,
        activePetriNetId: currentState.activePetriNetId,
        colorSets: currentState.colorSets,
        variables: currentState.variables,
        priorities: currentState.priorities,
        functions: currentState.functions,
        uses: currentState.uses,
      });
    },
    limit: 100,
  },
));

export default useStore;

/**
 * Begin an undo batch. All state changes until the matching `resumeUndo()`
 * are collapsed into a single undo entry. Nestable (e.g., dialog inside drag).
 */
export const pauseUndo = () => {
  _undoBatchDepth++;
};

/**
 * End an undo batch. When the outermost batch closes, the state from
 * before the first `pauseUndo()` is pushed as a single undo entry.
 */
export const resumeUndo = () => {
  if (_undoBatchDepth <= 0) return;
  _undoBatchDepth--;
  if (_undoBatchDepth === 0 && _undoBatchFirstState !== undefined && _realHandleSet) {
    // Flush: push the pre-batch state onto the undo stack
    _realHandleSet(_undoBatchFirstState, _undoBatchReplace as Parameters<typeof _realHandleSet>[1]);
    _undoBatchFirstState = undefined;
    _undoBatchReplace = undefined;
  }
};
