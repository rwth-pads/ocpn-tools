import { useState, useCallback, useRef } from 'react';
import useStore from '@/stores/store';
import init, { WasmSimulator, type InitOutput } from '@rwth-pads/cpnsim';
import { PetriNetData, convertToJSON } from '@/utils/FileOperations';
import type { SimulationEvent } from '@/components/EventLog'; // Import SimulationEvent
import { v4 as uuidv4 } from 'uuid'; // For generating unique event IDs

// Define TokenMovement locally as it's not exported from EventLog
export interface TokenMovement {
    placeId: string;
    placeName: string;
    tokens: string; // Keep as string for display consistency
}

export function useSimulationController() {
  const wasmRef = useRef<InitOutput | null>(null); // Initialize as null
  const wasmSimulatorRef = useRef<WasmSimulator | null>(null);
  const [isInitialized, setIsInitialized] = useState(false); // Track initialization
  const [events, setEvents] = useState<SimulationEvent[]>([]); // State for simulation events
  const [stepCounter, setStepCounter] = useState(0); // State for step counter
  const [simulationTime, setSimulationTime] = useState(0.0); // State for simulation time

  // Get necessary actions/state selectors from Zustand store
  const updateNodeMarking = useStore((state) => state.updateNodeMarking);
  const applyInitialMarkings = useStore((state) => state.applyInitialMarkings);

  // Helper function to find a node by ID across all Petri nets in the store
  const findNodeById = useCallback((nodeId: string) => {
    const currentPetriNetsById = useStore.getState().petriNetsById;
    for (const netId in currentPetriNetsById) {
      const node = currentPetriNetsById[netId].nodes.find(n => n.id === nodeId);
      if (node) {
        return node;
      }
    }
    return undefined; // Return undefined if not found
  }, []); // No dependencies, relies on getState

  // Callback for the WASM event listener
  // Stable callback: Dependencies are stable functions/setters
  const handleWasmEvent = useCallback((eventData: {
    transitionId: string;
    time: number; // Assuming WASM provides time
    consumed?: Map<string, number[]>; // Use any[] for tokens from WASM
    produced?: Map<string, number[]> // Use any[] for tokens from WASM
  }) => {

    // --- Update Markings in Zustand Store ---
    if (eventData.consumed instanceof Map) {
      eventData.consumed.forEach((tokens: number[], nodeId: string) => {
        const node = findNodeById(nodeId); // Use helper
        if (node && node.type === 'place') {
          let currentMarking: number[] = [];
          try {
            // Get the latest marking directly from the store state for accuracy
            const latestNodeState = findNodeById(nodeId); // Use helper
            const markingSource = latestNodeState?.data?.marking;
            // Marking in store should ideally be an array already
            if (Array.isArray(markingSource)) {
              currentMarking = markingSource;
            } else if (typeof markingSource === 'number') {
              // Handle single number marking
              currentMarking = [markingSource];
            } else if (typeof markingSource === 'string' && markingSource.trim() !== '') {
              // Fallback: try parsing if it's a string
              const parsedMarking = JSON.parse(markingSource);
              currentMarking = Array.isArray(parsedMarking) ? parsedMarking : [parsedMarking];
            }
          } catch (error) {
            console.error(`Error reading/parsing marking for node ${nodeId}:`, node.data.marking, error);
            currentMarking = [];
          }

          const updatedMarking = [...currentMarking]; // Clone to modify
          tokens.forEach((token: number) => {
            const tokenString = JSON.stringify(token); // Compare by string representation
            const index = updatedMarking.findIndex(mToken => JSON.stringify(mToken) === tokenString);
            if (index !== -1) {
              updatedMarking.splice(index, 1); // Remove one instance
            } else {
              // This might happen with complex tokens or if WASM state diverges; log it.
              console.warn(`Token not found for removal in node ${nodeId}:`, token, updatedMarking);
            }
          });
          // Update the store with the new marking (which should be an array)
          updateNodeMarking(nodeId, updatedMarking);
        } else {
          // Log if the node wasn't found or wasn't a place
          console.warn(`Place node not found or invalid for consumed event: ${nodeId}`);
        }
      });
    } else if (eventData.consumed) {
      // Log if consumed exists but isn't a Map (unexpected format)
      console.warn('eventData.consumed is not a Map:', eventData.consumed);
    }

    if (eventData.produced instanceof Map) {
      eventData.produced.forEach((tokens: number[], nodeId: string) => {
        const node = findNodeById(nodeId); // Use helper
        if (node && node.type === 'place') {
          let currentMarking: number[] = [];
           try {
             // Get the latest marking directly from the store state
            const latestNodeState = findNodeById(nodeId); // Use helper
            const markingSource = latestNodeState?.data?.marking;
             if (Array.isArray(markingSource)) {
              currentMarking = markingSource;
            } else if (typeof markingSource === 'number') {
              // Handle single number marking
              currentMarking = [markingSource];
            } else if (typeof markingSource === 'string' && markingSource.trim() !== '') {
              const parsedMarking = JSON.parse(markingSource);
              currentMarking = Array.isArray(parsedMarking) ? parsedMarking : [parsedMarking];
            }
          } catch (error) {
            console.error(`Error reading/parsing marking for node ${nodeId}:`, node.data.marking, error);
            currentMarking = [];
          }

          // Add produced tokens to the cloned marking
          const updatedMarking = [...currentMarking, ...tokens];
          // Update the store
          updateNodeMarking(nodeId, updatedMarking);
        } else {
           console.warn(`Place node not found or invalid for produced event: ${nodeId}`);
        }
      });
    } else if (eventData.produced) {
       console.warn('eventData.produced is not a Map:', eventData.produced);
    }

    // --- Create and Add SimulationEvent to Local State ---
    const transitionNode = findNodeById(eventData.transitionId); // Use helper
    // Ensure transitionName is a string (using label), fallback to transitionId
    const transitionName = (transitionNode?.data?.label && typeof transitionNode.data.label === 'string') ? transitionNode.data.label : eventData.transitionId;

    // Helper to convert WASM token map to TokenMovement array for the event log
    const mapTokenMovements = (tokenMap: Map<string, number[]> | undefined): TokenMovement[] => {
        if (!tokenMap) return [];
        const movements: TokenMovement[] = [];
        tokenMap.forEach((tokens, placeId) => {
            const placeNode = findNodeById(placeId); // Use helper
            // Ensure placeName is a string (using label), fallback to placeId
            const placeName = (placeNode?.data?.label && typeof placeNode.data.label === 'string') ? placeNode.data.label : placeId;
            movements.push({
                placeId: placeId,
                placeName: placeName, // Use validated name
                tokens: JSON.stringify(tokens), // Stringify tokens for display in EventLog
            });
        });
        return movements;
    };

    // Increment step counter *reactively* and get the new step number for this event
    let eventStepNumber = 0;
    setStepCounter(prev => {
        eventStepNumber = prev + 1; // This event corresponds to step 'prev + 1'
        return eventStepNumber;     // Update state to the new step number
    });

    // Construct the new event object
    const newEvent: SimulationEvent = {
      id: uuidv4(), // Generate unique ID
      step: eventStepNumber, // Use the *incremented* step number for this event
      time: eventData.time, // Time from WASM event
      transitionId: eventData.transitionId,
      transitionName: transitionName, // Use validated name (label)
      tokens: {
        consumed: mapTokenMovements(eventData.consumed),
        produced: mapTokenMovements(eventData.produced),
      },
      timestamp: new Date(), // Record when the event was processed by the UI
    };

    // Update the local events state for the EventLog component
    setEvents(prevEvents => [...prevEvents, newEvent]);
    // Update the simulation time state
    setSimulationTime(eventData.time);

  // Keep dependencies stable: only include functions/setters
  }, [updateNodeMarking, findNodeById, setStepCounter, setEvents, setSimulationTime]);

  // Function to initialize or re-initialize the WASM simulator
  async function _initializeWasm() {
    //console.log("Attempting to initialize WASM Simulator...");
    // Reset state before initialization
    setEvents([]);
    setStepCounter(0);
    setSimulationTime(0.0);
    setIsInitialized(false); // Mark as not initialized until successful
    wasmRef.current = null; // Clear refs
    wasmSimulatorRef.current = null;

    try {
        wasmRef.current = await init(); // Initialize the WASM module
        //console.log("WASM module loaded.");

        // Apply initial markings based on the current store state
        // This action should update the markings within the Zustand store
        applyInitialMarkings();
        //console.log("Initial markings applied to store.");

        // Get the *latest* state from the store *after* applying initial markings
        const currentPetriNetsById = useStore.getState().petriNetsById;
        const currentPetriNetOrder = useStore.getState().petriNetOrder;
        const currentColorSets = useStore.getState().colorSets;
        const currentVariables = useStore.getState().variables;
        const currentPriorities = useStore.getState().priorities;
        const currentFunctions = useStore.getState().functions;
        const currentUses = useStore.getState().uses;

        // Prepare the data structure for the WASM simulator
        const petriNetData: PetriNetData = {
          petriNetsById: structuredClone(currentPetriNetsById), // Deep clone the latest state
          petriNetOrder: currentPetriNetOrder,
          colorSets: currentColorSets,
          variables: currentVariables,
          priorities: currentPriorities,
          functions: currentFunctions,
          uses: currentUses,
        }

        // --- Preprocessing Petri Net Data for WASM ---
        // Ensure markings and inscriptions are in the format WASM expects (e.g., stringified JSON arrays)
        Object.values(petriNetData.petriNetsById).forEach((petriNet) => {
            petriNet.nodes.forEach((node) => {
                if (node.type === 'place') {
                    // Ensure node.data.marking is a stringified array for WASM
                    let markingArray: number[] = [];
                    if (Array.isArray(node.data.marking)) {
                        markingArray = node.data.marking; // Should be array after applyInitialMarkings/updateNodeMarking
                    } else if (typeof node.data.marking === 'string') { // Fallback if it's still string
                          try {
                            const parsed = JSON.parse(node.data.marking);
                            if (Array.isArray(parsed)) markingArray = parsed;
                         } catch { console.warn(`Could not parse marking string for node ${node.id}: ${node.data.marking}`); }
                    }
                    node.data.marking = JSON.stringify(markingArray); // Stringify for WASM

                    // Keep initialMarking as-is for WASM to evaluate as Rhai expression
                    // Only convert to array format if it's already a JSON array or a simple value
                    if (node.data.initialMarking) {
                        const im = node.data.initialMarking;
                        if (typeof im === 'string') {
                            // Check if it looks like a JSON array already
                            if (im.startsWith('[') && im.endsWith(']')) {
                                // Keep as-is - it's already an array expression
                            } else if (im.endsWith('.all()')) {
                                // Keep as-is - it's a colorset.all() expression
                            } else if (im.trim() === '') {
                                node.data.initialMarking = '[]';
                            }
                            // Otherwise keep the original expression (e.g., "1", "8")
                            // which Rhai can evaluate directly
                        } else if (Array.isArray(im)) {
                            node.data.initialMarking = JSON.stringify(im);
                        }
                    } else {
                        node.data.initialMarking = '[]';
                    }
                }
            });

            // Preprocess arc inscriptions like "2`var" into "[var,var]"
            petriNet.edges.forEach((arc) => {
                if (arc.label && typeof arc.label === 'string') {
                    const match = arc.label.match(/(\d+)\`(\w+)/); // Match "N`var"
                    if (match) {
                        const count = parseInt(match[1], 10);
                        const variableName = match[2];
                        if (!isNaN(count) && count > 0) {
                            const newInscription = `[${Array(count).fill(variableName).join(',')}]`;
                            console.log(`Converted arc inscription "${arc.label}" to "${newInscription}"`);
                            arc.label = newInscription;
                        }
                    }
                }
            });
        });
        // --- End Preprocessing ---

        // Convert the processed data to the final JSON format for WASM
        const petriNetJSON = convertToJSON(petriNetData);
        // console.log("Initializing WASM with JSON:", petriNetJSON); // Debug log (can be large)

        // Create the WASM simulator instance
        console.log("Creating WASM Simulator with JSON:", petriNetJSON);
        wasmSimulatorRef.current = new WasmSimulator(petriNetJSON);
        console.log("WASM Simulator created successfully");
        // Set the event listener callback
        wasmSimulatorRef.current.setEventListener(handleWasmEvent);
        // Mark initialization as complete
        setIsInitialized(true);
        console.log("WASM Simulator initialized successfully.");

    } catch (error) {
        // Log errors during initialization
        console.error("Error initializing WASM Simulator:", error);
        setIsInitialized(false); // Ensure state reflects failure
        wasmRef.current = null;
        wasmSimulatorRef.current = null;
    }
  }

  // Ensure the WASM module is initialized before running steps
  // Exposed for external use (e.g., before running multiple steps)
  const ensureInitialized = async () => {
    // Initialize only if refs are null or initialization flag is false
    if (!isInitialized || !wasmRef.current || !wasmSimulatorRef.current) {
        //console.log("Ensuring initialization...");
        await _initializeWasm();
    }
  };

  // Core logic to execute a single WASM step
  // Assumes WASM is already initialized
  const _executeWasmStep = () => {
    if (wasmSimulatorRef.current) { // Check the ref directly
        try {
            // Step counter is now incremented reactively in handleWasmEvent
            console.log(`Requesting simulation step...`);
            // Execute the step in WASM
            const result = wasmSimulatorRef.current.run_step();
            console.log(`Simulation step result:`, result);
            // Event handling (including state updates and step increment) happens in handleWasmEvent callback
        } catch (error) {
            console.error("Error running simulation step:", error);
            // Consider re-throwing or setting an error state if needed
        }
    } else {
        // This should ideally not happen if ensureInitialized succeeded without errors,
        // but keep the warning as a safeguard.
        console.warn("WASM Simulator ref is null after initialization attempt, cannot run step.");
    }
  };

  // Function to run a single simulation step (ensures init first)
  const runStep = async () => {
    await ensureInitialized(); // Make sure WASM is ready
    _executeWasmStep(); // Execute the core step logic
  };

  // Function to reset the simulation
  const reset = async () => {
    //console.log("Resetting simulation...");
    setStepCounter(0); // Reset step counter state
    setSimulationTime(0.0); // Reset simulation time state
    setEvents([]); // Reset events state
    // Re-initializing effectively resets the simulation state in WASM
    await _initializeWasm();
  };

  // Function to clear the event log in the UI
  const clearEvents = () => {
      //console.log("Clearing event log.");
      setEvents([]); // Reset the local events state
  }

  // Return the state and functions needed by UI components
  return { runStep, reset, events, clearEvents, isInitialized, simulationTime, stepCounter, ensureInitialized, _executeWasmStep };
}
