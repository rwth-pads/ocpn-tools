import React, { useCallback, useState, useContext, useRef, useEffect } from 'react';
import useStore from '@/stores/store';
import { usePetriNetHandlers } from '@/hooks/usePetriNetHandlers';

import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  useReactFlow,
  Node,
  Edge,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';

//import Dagre from '@dagrejs/dagre';

import { Toolbar } from "@/components/Toolbar";
import { Button } from "@/components/ui/button";

import { BoomerDial, type Slice } from "@/components/BoomerDial";

import { Save, FolderOpen } from "lucide-react";

import CustomConnectionLine from '../edges/CustomConnectionLine';
import { useDnD } from '../utils/DnDContext';

import { OpenDialog } from '@/components/dialogs/OpenDialog';
import { SaveDialog } from '@/components/dialogs/SaveDialog';

import { SimulationToolbar } from '@/components/SimulationToolbar';
import { AssistanceToolbar } from '@/components/AssistanceToolbar';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input'; // Ensure this path is correct
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import {
  convertToCPNToolsXML,
  convertToCPNPyJSON,
  convertToJSON,
  saveFile,
  parseFileContent,
  PetriNetData,
} from '@/utils/FileOperations';

import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';

import { type StoreState } from '@/stores/store'; // Ensure these types are defined in your store

import { LayoutOptions } from '@/components/LayoutPopover';

// Correct the import path for SimulationContext
import { SimulationContext } from '@/context/useSimulationContextHook';

const selector = (state: StoreState) => ({
  petriNetOrder: state.petriNetOrder,
  petriNetsById: state.petriNetsById,
  activePetriNetId: state.activePetriNetId,
  colorSets: state.colorSets,
  variables: state.variables,
  priorities: state.priorities,
  functions: state.functions,
  uses: state.uses,
  simulationEpoch: state.simulationEpoch,
  setSimulationEpoch: state.setSimulationEpoch,
  createPetriNet: state.createPetriNet,
  setActivePetriNet: state.setActivePetriNet,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  setColorSets: state.setColorSets,
  setVariables: state.setVariables,
  setPriorities: state.setPriorities,
  setFunctions: state.setFunctions,
  setUses: state.setUses,
  toggleArcMode: state.toggleArcMode,
  reset: state.reset,
});

const defaultEdgeOptions = {
  type: 'floating',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#000',
    width: 10,
    height: 10,
  },
};

const CPNCanvas = ({ onToggleAIAssistant }: { onToggleAIAssistant: () => void }) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [newPetriNetDialogOpen, setNewPetriNetDialogOpen] = useState(false);
  const [newPetriNetName, setNewPetriNetName] = useState('');

  const [isDialOpen, setIsDialOpen] = useState(false);
  const [dialPosition, setDialPosition] = useState({ x: 0, y: 0 });
  
  // Track snapped positions during node drag - these override React Flow's positions
  const nodeDragRef = useRef<{
    snappedPositions: Map<string, { x: number; y: number }>;
    isDragging: boolean;
    isSnapping: boolean;
  }>({ snappedPositions: new Map(), isDragging: false, isSnapping: false });

  const simulationContext = useContext(SimulationContext); // Get simulation context
  
  const {
    petriNetOrder,
    petriNetsById,
    activePetriNetId,
    colorSets,
    variables,
    priorities,
    functions,
    uses,
    simulationEpoch,
    setSimulationEpoch,
    createPetriNet,
    setActivePetriNet,
    setNodes,
    setEdges,
    setColorSets,
    setVariables,
    setPriorities,
    setFunctions,
    setUses,
    toggleArcMode,
    reset,
  } = useStore(
    useShallow(selector),
  );

  const petriNet = useStore(state => activePetriNetId ? state.petriNetsById[activePetriNetId] : null);
  const petriNetHandlers = usePetriNetHandlers(activePetriNetId || '');
  const { onNodesChange, onEdgesChange, onConnect } = activePetriNetId
    ? petriNetHandlers
    : { onNodesChange: () => {}, onEdgesChange: () => {}, onConnect: () => {} };

  const { fitView, screenToFlowPosition } = useReactFlow();
  const [type] = useDnD();

  // Keyboard shortcuts for simulation controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Check if simulation context is available
      if (!simulationContext) return;

      const { isRunning, runStep, runMultipleStepsAnimated, runMultipleStepsFast, reset: resetSimulation, stop, simulationConfig } = simulationContext;
      const isMeta = event.metaKey || event.ctrlKey;

      // Space: Play animated simulation
      if (event.code === 'Space' && !event.shiftKey && !isMeta) {
        event.preventDefault();
        if (isRunning) {
          stop();
        } else {
          runMultipleStepsAnimated(simulationConfig.stepsPerRun, simulationConfig.animationDelayMs);
        }
        return;
      }

      // Ctrl/Cmd + ArrowRight: Step forward
      if (event.code === 'ArrowRight' && isMeta && !event.shiftKey) {
        event.preventDefault();
        if (!isRunning) {
          runStep();
        }
        return;
      }

      // Ctrl/Cmd + Shift + ArrowRight: Fast forward (run multiple steps without animation)
      if (event.code === 'ArrowRight' && isMeta && event.shiftKey) {
        event.preventDefault();
        if (!isRunning) {
          runMultipleStepsFast(simulationConfig.stepsPerRun);
        }
        return;
      }

      // Ctrl/Cmd + ArrowLeft: Reset simulation
      if (event.code === 'ArrowLeft' && isMeta && !event.shiftKey) {
        event.preventDefault();
        if (!isRunning) {
          resetSimulation();
        }
        return;
      }

      // Escape: Stop running simulation
      if (event.code === 'Escape') {
        if (isRunning) {
          event.preventDefault();
          stop();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [simulationContext]);

  const slices = [
    { key: 'bottom', label: [''], angle: 90 },
    { key: 'undo', label: ['Undo'], angle: 150, disabled: true },
    { key: 'redo', label: ['Redo'], angle: 30, disabled: true },
    { key: 'new-place', label: ['New', 'Place'], angle: 210 },
    { key: 'create-aux', label: ['Create aux', 'text'], angle: 270, disabled: true },
    { key: 'new-transition', label: ['New', 'Transition'], angle: 330 },
  ];

  const onOpenPetriNet = (data: PetriNetData, fileName: string) => {
    if (data) {
      // Reset the current state
      reset();

      // Iterate over the array of Petri nets and add them to the store
      Object.values(data.petriNetsById).forEach((petriNet) => {
        useStore.getState().addPetriNet(petriNet);
      });

      // Set the active Petri net to the first one in the order
      if (data.petriNetOrder.length > 0) {
        useStore.getState().setActivePetriNet(data.petriNetOrder[0]);
      }

      // Update declarations if available
      if (data.colorSets) setColorSets(data.colorSets);
      if (data.variables) setVariables(data.variables);
      if (data.priorities) setPriorities(data.priorities);
      if (data.functions) setFunctions(data.functions);
      if (data.uses) setUses(data.uses);
      
      // Restore simulation settings if available
      if (data.simulationSettings) {
        // Restore simulation epoch
        if (data.simulationSettings.simulationEpoch !== undefined) {
          setSimulationEpoch(data.simulationSettings.simulationEpoch);
        }
        // Restore simulation config (stepsPerRun, animationDelayMs)
        if (simulationContext?.setSimulationConfig) {
          const currentConfig = simulationContext.simulationConfig;
          simulationContext.setSimulationConfig({
            ...currentConfig,
            stepsPerRun: data.simulationSettings.stepsPerRun ?? currentConfig.stepsPerRun,
            animationDelayMs: data.simulationSettings.animationDelayMs ?? currentConfig.animationDelayMs,
          });
        }
      }

      // If we imported a JSON file, layout the graph
      if (fileName.endsWith('.json')) {
        const layoutOptions: LayoutOptions = {
          algorithm: 'dagre',
          direction: 'TB',
          nodeSeparation: 150,
          rankSeparation: 50,
        };

        // Apply layout to all Petri nets (applyLayout will call fitView after completion)
        Object.values(data.petriNetsById).forEach((petriNet) => {
          applyLayout(layoutOptions, petriNet.nodes, petriNet.edges);
        });
      } else {
        // For other formats (OCPN, CPN), fit the view immediately after loading
        window.requestAnimationFrame(() => {
          fitView({ padding: 0.2, maxZoom: 4 });
        });
      }
    }
  };

  const handleFileLoaded = (fileContent: string, fileName: string) => {
    // Reset simulation state before loading new file
    if (simulationContext) {
      simulationContext.reset(); // Call simulation reset
    } else {
      console.error("Simulation context not found, cannot reset simulation state.");
      // Optionally, handle the case where context is not available, though it should be if setup correctly.
    }

    const data = parseFileContent(fileContent, fileName)
    if (data) {
      onOpenPetriNet(data, fileName);
    } else {
      // Show error notification
      alert("Failed to parse the file. Please check the file format.")
    }
  }

  const handleSave = (format: string) => {
    let content: string
    let filename: string

    const petriNetData: PetriNetData = {
      petriNetsById,
      petriNetOrder,
      colorSets,
      variables,
      priorities,
      functions,
      uses,
      // Include simulation settings for JSON/OCPN format
      simulationSettings: {
        stepsPerRun: simulationContext?.simulationConfig?.stepsPerRun,
        animationDelayMs: simulationContext?.simulationConfig?.animationDelayMs,
        simulationEpoch: simulationEpoch,
      },
    }

    switch (format) {
      case "cpn-tools":
        content = convertToCPNToolsXML({
          ...petriNetData,
          petriNetsById: Object.fromEntries(
            Object.entries(petriNetData.petriNetsById).map(([id, net]) => [
              id,
              {
                ...net,
                nodes: net.nodes.map((node) => ({
                  ...node,
                  position: {
                    ...node.position,
                    y: -node.position.y, // Invert y-axis for CPN Tools
                  },
                })),
              },
            ])
          ),
        });
        //filename = `${petriNetsById.name.replace(/\s+/g, "_")}.cpn`;
        filename = 'PetriNet.cpn';
        break;
      case "cpn-py":
        content = convertToCPNPyJSON(petriNetData);
        //filename = `${petriNetData.name.replace(/\s+/g, "_")}.json`;
        filename = 'PetriNet.json';
        break;
      case "json":
      default:
        content = convertToJSON(petriNetData);
        //filename = `${petriNetData.name.replace(/\s+/g, "_")}.ocpn`;
        filename = 'PetriNet.ocpn';
        break;
    }

    saveFile(content, filename);
  }

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!type || typeof type !== 'string') {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        width: type === 'transition' ? 60 : 30,
        data: {
          label: type === 'auxText' ? 'Annotation' : `${type}`,
          ...(type === 'place' ? { colorSet: '' } : type === 'transition' ? { guard: '' } : {}),
        },
      };

      if (activePetriNetId) {
        useStore.getState().addNode(activePetriNetId, newNode);
      } else {
        console.error("Cannot add node: activePetriNetId is null.");
      }
    },
    [screenToFlowPosition, type, activePetriNetId]
  );

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setIsDialOpen(false);
    if (activePetriNetId) {
      useStore.getState().setSelectedElement(activePetriNetId, { type: "node", element: node });
    } else {
      console.error("Cannot set selected element: activePetriNetId is null.");
    }
  }, [activePetriNetId]);

  // Handle node drag start
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onNodeDragStart = useCallback((_event: React.MouseEvent, _node: Node, _nodes: Node[]) => {
    nodeDragRef.current.isDragging = true;
    nodeDragRef.current.isSnapping = false;
    nodeDragRef.current.snappedPositions.clear();
  }, []);

  // Handle node drag - apply shift-snap to align with connected edges
  // When snapping, we find the snap offset for ONE node and apply it to ALL nodes in the group
  const onNodeDrag = useCallback((event: React.MouseEvent, _node: Node, nodes: Node[]) => {
    if (!activePetriNetId || nodes.length === 0) return;
    
    const petriNet = useStore.getState().petriNetsById[activePetriNetId];
    if (!petriNet) return;
    
    // Clear snapped positions if shift is not pressed
    if (!event.shiftKey) {
      nodeDragRef.current.isSnapping = false;
      nodeDragRef.current.snappedPositions.clear();
      return;
    }
    
    const SNAP_THRESHOLD = 20;
    
    // Find a snap offset by checking all dragged nodes against their connected edges
    let snapDeltaX: number | null = null;
    let snapDeltaY: number | null = null;
    
    // Get the set of dragged node IDs for quick lookup
    const draggedNodeIds = new Set(nodes.map(n => n.id));
    
    // Check each dragged node for snap opportunities
    for (const draggedNode of nodes) {
      if (snapDeltaX !== null && snapDeltaY !== null) break; // Already found both snaps
      
      const nodeCenter = {
        x: draggedNode.position.x + (draggedNode.measured?.width || 50) / 2,
        y: draggedNode.position.y + (draggedNode.measured?.height || 30) / 2,
      };
      
      // Find all connected edges to nodes NOT in the dragged group
      const connectedEdges = petriNet.edges.filter(
        (edge) => {
          const isConnected = edge.source === draggedNode.id || edge.target === draggedNode.id;
          if (!isConnected) return false;
          // Only consider edges to nodes outside the dragged group
          const otherNodeId = edge.source === draggedNode.id ? edge.target : edge.source;
          return !draggedNodeIds.has(otherNodeId);
        }
      );
      
      for (const edge of connectedEdges) {
        if (snapDeltaX !== null && snapDeltaY !== null) break;
        
        // Find the other node (which is NOT being dragged)
        const otherNodeId = edge.source === draggedNode.id ? edge.target : edge.source;
        const otherNode = petriNet.nodes.find((n) => n.id === otherNodeId);
        if (!otherNode) continue;
        
        const otherCenter = {
          x: otherNode.position.x + (otherNode.measured?.width || 50) / 2,
          y: otherNode.position.y + (otherNode.measured?.height || 30) / 2,
        };
        
        // Check if we have bendpoints - if so, use the first/last bendpoint as reference
        const bendpoints = edge.data?.bendpoints as { x: number; y: number }[] | undefined;
        let referencePoint = otherCenter;
        
        if (bendpoints && bendpoints.length > 0) {
          // Use the bendpoint closest to the dragged node
          if (edge.source === draggedNode.id) {
            referencePoint = bendpoints[0]; // First bendpoint for outgoing edge
          } else {
            referencePoint = bendpoints[bendpoints.length - 1]; // Last bendpoint for incoming edge
          }
        }
        
        // Check for horizontal alignment (same Y) - snap the center
        if (snapDeltaY === null && Math.abs(nodeCenter.y - referencePoint.y) < SNAP_THRESHOLD) {
          snapDeltaY = referencePoint.y - nodeCenter.y;
        }
        
        // Check for vertical alignment (same X) - snap the center
        if (snapDeltaX === null && Math.abs(nodeCenter.x - referencePoint.x) < SNAP_THRESHOLD) {
          snapDeltaX = referencePoint.x - nodeCenter.x;
        }
      }
    }
    
    // If we found a snap, store the snapped positions
    if (snapDeltaX !== null || snapDeltaY !== null) {
      nodeDragRef.current.isSnapping = true;
      nodeDragRef.current.snappedPositions.clear();
      
      // Calculate and store snapped positions for all dragged nodes
      nodes.forEach((draggedNode) => {
        const snappedPos = {
          x: draggedNode.position.x + (snapDeltaX ?? 0),
          y: draggedNode.position.y + (snapDeltaY ?? 0),
        };
        nodeDragRef.current.snappedPositions.set(draggedNode.id, snappedPos);
      });
      
      // Apply snapped positions to store
      const updatedNodes = petriNet.nodes.map((node) => {
        const snappedPos = nodeDragRef.current.snappedPositions.get(node.id);
        if (snappedPos) {
          return { ...node, position: snappedPos };
        }
        return node;
      });
      
      setNodes(activePetriNetId, updatedNodes);
    } else {
      nodeDragRef.current.isSnapping = false;
      nodeDragRef.current.snappedPositions.clear();
    }
  }, [activePetriNetId, setNodes]);
  
  // Handle node drag stop
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onNodeDragStop = useCallback((_event: React.MouseEvent, _node: Node, _nodes: Node[]) => {
    // Keep snapped positions for one more cycle to override React Flow's final position
    // The onNodesChange handler will use these
    setTimeout(() => {
      nodeDragRef.current.isDragging = false;
      nodeDragRef.current.isSnapping = false;
      nodeDragRef.current.snappedPositions.clear();
    }, 50);
  }, []);
  
  // Custom onNodesChange that respects snapped positions
  const customOnNodesChange = useCallback((changes: import('@xyflow/react').NodeChange[]) => {
    if (!activePetriNetId) return;
    
    // If we're snapping, override position changes with our snapped positions
    if (nodeDragRef.current.isSnapping && nodeDragRef.current.snappedPositions.size > 0) {
      const modifiedChanges = changes.map((change) => {
        if (change.type === 'position' && 'id' in change && change.position) {
          const snappedPos = nodeDragRef.current.snappedPositions.get(change.id);
          if (snappedPos) {
            return {
              ...change,
              position: snappedPos,
            };
          }
        }
        return change;
      });
      onNodesChange(modifiedChanges);
    } else {
      onNodesChange(changes);
    }
  }, [activePetriNetId, onNodesChange]);

  // Handle edge selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setIsDialOpen(false);
    if (activePetriNetId) {
      useStore.getState().setSelectedElement(activePetriNetId, { type: "edge", element: edge });
    } else {
      console.error("Cannot set selected element: activePetriNetId is null.");
    }
  }, [activePetriNetId])

  // Handle background click (deselect)
  const onPaneClick = useCallback(() => {
    if (activePetriNetId) {
      useStore.getState().setSelectedElement(activePetriNetId, null);
    } else {
      console.error("Cannot set selected element: activePetriNetId is null.");
    }
    setIsDialOpen(false);
  }, [activePetriNetId])

  const onPaneContextMenu = useCallback((event: MouseEvent | React.MouseEvent) => {
    event.preventDefault();
    const reactEvent = event as React.MouseEvent<Element, MouseEvent>;
    const position = {
      x: reactEvent.clientX,
      y: reactEvent.clientY,
    };

    // Show context menu
    setDialPosition(position);
    setIsDialOpen(true);
  }
  , []);

  const handleSliceClick = (_: number, slice: Slice) => {
    // Perform action based on slice.id
    const nodeWidth = slice.key === 'new-place' ? 50 : 60; // Adjust width based on node type
    const nodeHeight = slice.key === 'new-place' ? 50 : 40; // Adjust height based on node type
    const position = {
      x: screenToFlowPosition(dialPosition).x - nodeWidth / 2,
      y: screenToFlowPosition(dialPosition).y - nodeHeight / 2,
    };
    if (slice.key === 'new-place') {
      const newNode = {
        id: `node_${Date.now()}`,
        type: 'place',
        position,
        data: { label: 'place', isArcMode: false, colorSet: '' },
      };
      if (activePetriNetId) {
        useStore.getState().addNode(activePetriNetId, newNode);
      }
    } else if (slice.key === 'new-transition') {
      const newNode = {
        id: `node_${Date.now()}`,
        type: 'transition',
        position,
        width: 60,
        data: { label: 'transition', isArcMode: false, guard: '' },
      };
      if (activePetriNetId) {
        useStore.getState().addNode(activePetriNetId, newNode);
      }
    }
    setIsDialOpen(false);
  }

  const applyLayout = useCallback(
    async (options: LayoutOptions, currentNodes: Node[], currentEdges: Edge[]) => {
      if (!currentNodes.length) return;

      // Clear bendpoints from all edges before applying layout
      const edgesWithoutBendpoints = currentEdges.map((edge) => ({
        ...edge,
        data: edge.data ? { ...edge.data, bendpoints: undefined } : edge.data,
      }));
      
      if (activePetriNetId) {
        setEdges(activePetriNetId, edgesWithoutBendpoints);
      }

      try {
        if (options.algorithm === "dagre") {
          // Dynamically import dagre
          const Dagre = await import('@dagrejs/dagre');

          // Create a new graph
          const g = new Dagre.graphlib.Graph();
          g.setGraph({
            rankdir: options.direction,
            nodesep: options.nodeSeparation,
            ranksep: options.rankSeparation,
            ranker: "network-simplex",
          });
          g.setDefaultEdgeLabel(() => ({}));

          currentEdges.forEach((edge) => g.setEdge(edge.source, edge.target));
          currentNodes.forEach((node) =>
            g.setNode(node.id, {
              ...node,
              width: node.measured?.width ?? 0,
              height: node.measured?.height ?? 0,
            }),
          );

          // Apply the layout
          Dagre.layout(g);

          const layoutedNodes = currentNodes.map((node) => {
            const position = g.node(node.id);
            const x = position.x - (node.measured?.width ?? 0) / 2;
            const y = position.y - (node.measured?.height ?? 0) / 2;

            return { ...node, position: { x, y } };
          });

          if (activePetriNetId) {
            setNodes(activePetriNetId, [...layoutedNodes]);
            //setEdges(activePetriNetId, [...currentEdges]);
          }
        } else if (options.algorithm === "elk") {
          // Dynamically import ELK
          const { default: ELK } = await import("elkjs/lib/elk.bundled.js");

          const elk = new ELK();

          // Prepare the graph for ELK
          const graph = {
            id: "root",
            layoutOptions: {
              "elk.algorithm": "layered",
              "elk.direction": options.direction === "TB" ? "DOWN" : "RIGHT",
              "elk.spacing.nodeNode": options.nodeSeparation.toString(),
              "elk.layered.spacing.nodeNodeBetweenLayers": options.rankSeparation.toString(),
            },
            children: currentNodes.map((node) => ({
              id: node.id,
              width: Number(node.style?.width || 80),
              height: Number(node.style?.height || 80),
            })),
            edges: currentEdges.map((edge) => ({
              id: edge.id,
              sources: [edge.source],
              targets: [edge.target],
            })),
          };

          // Apply the layout
          const elkGraph = await elk.layout(graph);

          // Get the new node positions
          if (elkGraph.children) {
            const layoutedNodes = currentNodes.map((node) => {
              const elkNode = elkGraph.children?.find((n) => n.id === node.id);
              if (elkNode && elkNode.x !== undefined && elkNode.y !== undefined) {
                return {
                  ...node,
                  position: {
                    x: elkNode.x,
                    y: elkNode.y,
                  },
                };
              }
              return node;
            });

            // Update the nodes
            if (activePetriNetId) {
              setNodes(activePetriNetId, [...layoutedNodes]);
            } 
          }
        }

        // After layout is applied, fit the view using requestAnimationFrame
        window.requestAnimationFrame(() => {
          fitView({ padding: 0.2 }); // Keep fitView here for layout adjustments
        });
      } catch (error) {
        console.error("Error applying layout:", error);
      }
    },
    [setNodes, setEdges, fitView, activePetriNetId], // Keep fitView dependency if layout calls it
  );

  const handleAddPetriNet = (e: React.FormEvent) => {
    e.preventDefault();

    createPetriNet(newPetriNetName); // Add the new Petri net to the store
    // close dialog
    setNewPetriNetDialogOpen(false);
    setNewPetriNetName(''); // Clear the input field
  };

  return (
    <div className="dndflow flex flex-col grow"> {/* Ensure this container allows growth */}
      <div className="flex flex-col grow" style={{ height: 100 }}> {/* Ensure this container allows growth */}
        {/* Toolbar Panel */}
        <div className="flex items-center justify-between p-2 border-b">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="ghost" size="icon" title="Open" onClick={() => setOpenDialogOpen(true)}>
                      <FolderOpen className="h-5 w-5" />
                      <span className="sr-only">Open Petri Net</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Open Petri Net</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="ghost" size="icon" title="Save" onClick={() => setSaveDialogOpen(true)}>
                      <Save className="h-5 w-5" />
                      <span className="sr-only">Save Petri Net</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save Petri Net</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <SimulationToolbar/>
          <AssistanceToolbar onToggleAIAssistant={onToggleAIAssistant} />
        </div>

        <OpenDialog open={openDialogOpen} onOpenChange={setOpenDialogOpen} onFileLoaded={handleFileLoaded} />

        <SaveDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          onSave={handleSave}
          petriNetName="Petri Net" //{activePetriNetName}
        />

        {/* A Tab bar with the names of the Petri nets */}
        <div className="flex flex-col w-full mx-auto bg-muted">
          <Tabs
            defaultValue={activePetriNetId || petriNetOrder[0]}
            value={activePetriNetId ?? undefined}
            onValueChange={(value) => setActivePetriNet(value)}
            className="flex flex-col gap-2 items-start"
          >
            <TabsList className="flex gap-4 items-center">
              {petriNetOrder.map((id) => (
                <TabsTrigger key={id} value={id}>
                  {petriNetsById[id].name}
                </TabsTrigger>
              ))}
              <Button variant="ghost" onClick={() => setNewPetriNetDialogOpen(true)}>New Subnet</Button>
              <Dialog open={newPetriNetDialogOpen} onOpenChange={setNewPetriNetDialogOpen}>
                <DialogContent className="p-4">
                  <DialogHeader>
                    <DialogTitle>Add New Subnet</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddPetriNet} className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="petri-net-name">Subnet Name</Label>
                      <Input
                        id="petri-net-name"
                        placeholder="Enter Petri Net name"
                        value={newPetriNetName}
                        onChange={(e) => setNewPetriNetName(e.target.value)}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Add Petri Net
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </TabsList>
          </Tabs>
        </div>

        {/* ReactFlow Component Wrapper */}
        {/* Add w-full and h-full to ensure the wrapper takes available space */}
        {/* <div className="reactflow-wrapper w-full h-full" ref={reactFlowWrapper}> */}
          <ReactFlow
            nodes={petriNet?.nodes || []}
            nodeTypes={nodeTypes}
            edges={petriNet?.edges || []}
            edgeTypes={edgeTypes}
            onNodesChange={customOnNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStart={(event, node, nodes) => {
              onNodeClick(event, node);
              onNodeDragStart(event, node, nodes);
            }}
            onNodeDrag={onNodeDrag}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onPaneContextMenu={onPaneContextMenu}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            fitView
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineComponent={CustomConnectionLine}
            maxZoom={4}
            selectionOnDrag
            selectionKeyCode="Shift"
            multiSelectionKeyCode={['Meta', 'Control']}
            onInit={(instance) => {
              // Using requestAnimationFrame to ensure layout is stable
              requestAnimationFrame(() => {
                instance.fitView({ maxZoom: 4, padding: 0.1 });
              });
            }}
          >
            <Background />
            <MiniMap />
            <Controls />
            <Panel position="top-center">
              <Toolbar toggleArcMode={toggleArcMode} onApplyLayout={(options) => petriNet && applyLayout(options, petriNet.nodes, petriNet.edges)}/>
            </Panel>
            <BoomerDial
              slices={slices}
              position={dialPosition}
              isOpen={isDialOpen}
              onClose={() => setIsDialOpen(false)}
              onSliceClick={handleSliceClick}
              size={200}
            />
          </ReactFlow>
        {/* </div> */}
      </div>
    </div>
  );
};

export default CPNCanvas;