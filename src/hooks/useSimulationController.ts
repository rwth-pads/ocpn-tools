// hooks/usePetriNetController.ts
import { useRef, useCallback } from 'react';
import useStore from '@/stores/store';
import init, { WasmSimulator, type InitOutput } from '@rwth-pads/cpnsim';

import { PetriNetData, convertToJSON } from '@/utils/FileOperations';

export function useSimulationController() {
  const wasmRef = useRef<InitOutput>(null);
  const wasmSimulatorRef = useRef<WasmSimulator | null>(null);
  
  const petriNetOrder = useStore((state) => state.petriNetOrder);
  const colorSets = useStore((state) => state.colorSets);
  const variables = useStore((state) => state.variables);
  const priorities = useStore((state) => state.priorities);
  const functions = useStore((state) => state.functions);
  const uses = useStore((state) => state.uses);
  const updateNodeMarking = useStore((state) => state.updateNodeMarking);
  const applyInitialMarkings = useStore((state) => state.applyInitialMarkings);

  // Callback for the WASM event listener
  const handleWasmEvent = useCallback((eventData: { consumed?: Map<string, number[]>; produced?: Map<string, number[]> }) => {
    // Access the latest state directly from the store
    const currentPetriNetsById = useStore.getState().petriNetsById;

    // Check if consumed is a Map and iterate accordingly
    if (eventData.consumed instanceof Map) {
      eventData.consumed.forEach((tokens: number[], nodeId: string) => {
        const node = Object.values(currentPetriNetsById).flatMap((pn) => pn.nodes).find((n) => n.id === nodeId);
        if (node) {
          let currentMarking: number[] = [];
          try {
            // Check if node.data.marking is a non-empty string before parsing
            if (typeof node.data.marking === 'string' && node.data.marking.trim() !== '') {
              const parsedMarking = JSON.parse(node.data.marking);
              // Ensure parsedMarking is an array
              currentMarking = Array.isArray(parsedMarking) ? parsedMarking : [];
            } else if (Array.isArray(node.data.marking)) {
              // Handle cases where marking might already be an array (though store expects string)
              currentMarking = node.data.marking;
            }
          } catch (error) {
             console.error(`Error parsing marking for node ${nodeId}:`, node.data.marking, error);
             // Default to empty array on parsing error
             currentMarking = [];
          }

          const updatedMarking = currentMarking.slice();
          tokens.forEach((token: number) => {
            const index = updatedMarking.findIndex(mToken => JSON.stringify(mToken) === JSON.stringify(token));
            if (index !== -1) {
              updatedMarking.splice(index, 1); // Remove only the first matching occurrence
            } else {
              console.warn(`Token not found for removal in node ${nodeId}:`, token, updatedMarking);
            }
          });
          const updatedMarkingJSON = updatedMarking;
          updateNodeMarking(nodeId, updatedMarkingJSON);
        } else {
           console.warn(`Node not found for consumed event: ${nodeId}`);
        }
      });
    } else if (eventData.consumed) {
      // Fallback or error handling if it's not a Map but exists
      console.warn('eventData.consumed is not a Map:', eventData.consumed);
    }

    // Check if produced is a Map and iterate accordingly
    if (eventData.produced instanceof Map) {
      eventData.produced.forEach((tokens: number[], nodeId: string) => {
        const node = Object.values(currentPetriNetsById).flatMap((pn) => pn.nodes).find((n) => n.id === nodeId);
        if (node) {
           let currentMarking: number[] = [];
           try {
             if (typeof node.data.marking === 'string' && node.data.marking.trim() !== '') {
               const parsedMarking = JSON.parse(node.data.marking);
               currentMarking = Array.isArray(parsedMarking) ? parsedMarking : [];
             } else if (Array.isArray(node.data.marking)) {
               currentMarking = node.data.marking;
             }
           } catch (error) {
             console.error(`Error parsing marking for node ${nodeId}:`, node.data.marking, error);
             currentMarking = [];
           }

          const updatedMarking = currentMarking.slice();
          tokens.forEach((token: number) => {
            updatedMarking.push(token);
          });
          //const updatedMarkingJSON = JSON.stringify(updatedMarking);
          updateNodeMarking(nodeId, updatedMarking);
        } else {
           console.warn(`Node not found for produced event: ${nodeId}`);
        }
      });
    } else if (eventData.produced) {
       // Fallback or error handling if it's not a Map but exists
       console.warn('eventData.produced is not a Map:', eventData.produced);
    }
    //setLastEvent(eventData); // Update state with the received event
  }, [updateNodeMarking]); // Remove petriNetsById from dependencies

  const ensureInitialized = async () => {
    if (!wasmRef.current) {
      wasmRef.current = await init();

      applyInitialMarkings();

      const petriNetData: PetriNetData = {
        petriNetsById: structuredClone(useStore.getState().petriNetsById),
        petriNetOrder,
        colorSets,
        variables,
        priorities,
        functions,
        uses,
      }

      Object.values(petriNetData.petriNetsById).forEach((petriNet) => {
        petriNet.nodes.forEach((node) => {
          if (node.type === 'place' && typeof node.data.initialMarking === 'string' && node.data.initialMarking.endsWith('.all()')) {
            node.data.initialMarking = JSON.stringify(node.data.marking);
            node.data.marking = JSON.stringify(node.data.marking);
          } else if (node.type === 'place') {
            node.data.marking = JSON.stringify(node.data.marking);
          }
        });
      });

      const petriNetJSON = convertToJSON(petriNetData);

      wasmSimulatorRef.current = new WasmSimulator(petriNetJSON);

      wasmSimulatorRef.current.setEventListener(handleWasmEvent);
    }
  };

  const runStep = async () => {
    await ensureInitialized();
    wasmSimulatorRef.current?.run_step();
  };

  const reset = async () => {
    //Re-init the WASM module
    wasmRef.current = await init();

      applyInitialMarkings();

      const petriNetData: PetriNetData = {
        petriNetsById: structuredClone(useStore.getState().petriNetsById),
        petriNetOrder,
        colorSets,
        variables,
        priorities,
        functions,
        uses,
      }

      Object.values(petriNetData.petriNetsById).forEach((petriNet) => {
        petriNet.nodes.forEach((node) => {
          if (node.type === 'place' && typeof node.data.initialMarking === 'string' && node.data.initialMarking.endsWith('.all()')) {
            node.data.initialMarking = JSON.stringify(node.data.marking);
            node.data.marking = JSON.stringify(node.data.marking);
          } else if (node.type === 'place') {
            node.data.marking = JSON.stringify(node.data.marking);
          }
        });
      });
      
      const petriNetJSON = convertToJSON(petriNetData);

      wasmSimulatorRef.current = new WasmSimulator(petriNetJSON);

      wasmSimulatorRef.current.setEventListener(handleWasmEvent);
  };

  return { runStep, reset };
}
