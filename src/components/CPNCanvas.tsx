import React, { useCallback, useState, useContext } from 'react'; // Added useContext
import useStore from '@/stores/store';
import { usePetriNetHandlers } from '@/hooks/usePetriNetHandlers';

import {
  ReactFlow,
  Background,
  Controls,
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
    width: 15,
    height: 15,
  },
};

const CPNCanvas = ({ onToggleAIAssistant }: { onToggleAIAssistant: () => void }) => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [newPetriNetDialogOpen, setNewPetriNetDialogOpen] = useState(false);
  const [newPetriNetName, setNewPetriNetName] = useState('');

  const [isDialOpen, setIsDialOpen] = useState(false);
  const [dialPosition, setDialPosition] = useState({ x: 0, y: 0 });

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
    createPetriNet,
    setActivePetriNet,
    setNodes,
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
    [setNodes, fitView, activePetriNetId], // Keep fitView dependency if layout calls it
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
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStart={onNodeClick}
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
            onInit={(instance) => {
              // Using requestAnimationFrame to ensure layout is stable
              requestAnimationFrame(() => {
                instance.fitView({ maxZoom: 4, padding: 0.1 });
              });
            }}
          >
            <Background />
            {/* <MiniMap /> */}
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