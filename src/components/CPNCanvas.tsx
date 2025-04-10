import React, { useRef, useCallback, useState } from 'react';
import useStore from '@/stores/store';

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

import '@xyflow/react/dist/style.css';

import { Toolbar } from "@/components/Toolbar";
import { Button } from "@/components/ui/button"

import { BoomerDial, type Slice } from "@/components/BoomerDial";

import { Save, FolderOpen } from "lucide-react"

import CustomConnectionLine from '../edges/CustomConnectionLine';
import { useDnD } from '../utils/DnDContext';

import { OpenDialog } from '@/components/dialogs/OpenDialog';
import { SaveDialog } from '@/components/dialogs/SaveDialog';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';

import {
  convertToCPNToolsXML,
  convertToCPNPyXML,
  convertToJSON,
  saveFile,
  parseFileContent,
  PetriNetData,
} from '@/utils/FileOperations';

import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';

import { type StoreState } from '@/stores/store'; // Ensure this type is defined in your store

import { LayoutOptions } from '@/components/LayoutPopover';

const selector = (state: StoreState) => ({
  nodes: state.nodes,
  edges: state.edges,
  colorSets: state.colorSets,
  variables: state.variables,
  priorities: state.priorities,
  functions: state.functions,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  setColorSets: state.setColorSets,
  setVariables: state.setVariables,
  setPriorities: state.setPriorities,
  setFunctions: state.setFunctions,
  onConnect: state.onConnect,
  setSelectedElement: state.setSelectedElement,
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

const CPNCanvas = () => {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [openDialogOpen, setOpenDialogOpen] = useState(false);

  const [isDialOpen, setIsDialOpen] = useState(false);
  const [dialPosition, setDialPosition] = useState({ x: 0, y: 0 });

  const reactFlowWrapper = useRef(null);
  
  const {
    nodes,
    edges,
    colorSets,
    variables,
    priorities,
    functions,
    onNodesChange,
    onEdgesChange,
    setNodes,
    setEdges,
    setColorSets,
    setVariables,
    setPriorities,
    setFunctions,
    onConnect,
    setSelectedElement,
    toggleArcMode,
    reset,
  } = useStore(
    useShallow(selector),
  );

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

  const onOpenPetriNet = (data: PetriNetData) => {
    if (data) {
      // Reset the current state
      reset();

      // Create a new Petri Net from the imported data
      const newId = 'net'; //`net${petriNets.length + 1}`
      const newNet = {
        id: newId,
        name: data.name || `Imported Net`, //${petriNets.length + 1}`,
        nodes: data.nodes || [],
        edges: data.edges || [],
      };

      // Add new net and switch to it
      //setPetriNets((prev) => [...prev, newNet])
      //setActiveNetId(newId)
      setNodes(newNet.nodes);
      setEdges(newNet.edges);

      // Update declarations if available
      if (data.colorSets) setColorSets(data.colorSets);
      if (data.variables) setVariables(data.variables);
      if (data.priorities) setPriorities(data.priorities);
      if (data.functions) setFunctions(data.functions);

      fitView();
    }
  };

  const handleFileLoaded = (fileContent: string, fileName: string) => {
    const data = parseFileContent(fileContent, fileName)
    if (data) {
      onOpenPetriNet(data)
    } else {
      // Show error notification
      alert("Failed to parse the file. Please check the file format.")
    }
  }

  const handleSave = (format: string) => {
    let content: string
    let filename: string

    const petriNetData: PetriNetData = {
      id: 'net',
      name: 'PetriNet',
      nodes,
      edges,
      colorSets,
      variables,
      priorities,
      functions,
    }

    switch (format) {
      case "cpn-tools":
        content = convertToCPNToolsXML(petriNetData)
        filename = `${petriNetData.name.replace(/\s+/g, "_")}.cpn`
        break
      case "cpn-py":
        content = convertToCPNPyXML(petriNetData)
        filename = `${petriNetData.name.replace(/\s+/g, "_")}.xml`
        break
      case "json":
      default:
        content = convertToJSON(petriNetData)
        filename = `${petriNetData.name.replace(/\s+/g, "_")}.json`
        break
    }

    saveFile(content, filename)
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
          label: `${type}`,
          ...(type === 'place' ? { colorSet: '' } : type === 'transition' ? { guard: '' } : {}),
        },
      };

      useStore.getState().addNode(newNode);
    },
    [screenToFlowPosition, type]
  );

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setIsDialOpen(false);
    setSelectedElement({ type: "node", element: node })
  }, [setSelectedElement]);

  // Handle edge selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setIsDialOpen(false);
    setSelectedElement({ type: "edge", element: edge })
  }, [setSelectedElement])

  // Handle background click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedElement(null);
    setIsDialOpen(false);
  }, [setSelectedElement])

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
      useStore.getState().addNode(newNode);
    } else if (slice.key === 'new-transition') {
      const newNode = {
        id: `node_${Date.now()}`,
        type: 'transition',
        position,
        width: 60,
        data: { label: 'transition', isArcMode: false, guard: '' },
      };
      useStore.getState().addNode(newNode);
    }
    setIsDialOpen(false);
  }

  const applyLayout = useCallback(
    async (options: LayoutOptions) => {
      if (!nodes.length) return;


      try {
        if (options.algorithm === "dagre") {
          // Dynamically import dagre
          const Dagre = await import('@dagrejs/dagre');

          // Create a new graph
          const g = new Dagre.graphlib.Graph()
          g.setGraph({
            rankdir: options.direction,
            nodesep: options.nodeSeparation,
            ranksep: options.rankSeparation,
            ranker: "network-simplex",
          });
          g.setDefaultEdgeLabel(() => ({}));

          edges.forEach((edge) => g.setEdge(edge.source, edge.target));
          nodes.forEach((node) =>
            g.setNode(node.id, {
              ...node,
              width: node.measured?.width ?? 0,
              height: node.measured?.height ?? 0,
            }),
          );

          // Apply the layout
          Dagre.layout(g)

          edges.forEach((edge) => g.setEdge(edge.source, edge.target));
          nodes.forEach((node) =>
            g.setNode(node.id, {
              ...node,
              width: node.measured?.width ?? 0,
              height: node.measured?.height ?? 0,
            }),
          );
        
          Dagre.layout(g);

          const layoutedNodes = nodes.map((node) => {
            const position = g.node(node.id);
            // We are shifting the dagre node position (anchor=center center) to the top left
            // so it matches the React Flow node anchor point (top left).
            const x = position.x - (node.measured?.width ?? 0) / 2;
            const y = position.y - (node.measured?.height ?? 0) / 2;

            return { ...node, position: { x, y } };
          });

          setNodes([...layoutedNodes]);
          setEdges([...edges]);

        } else if (options.algorithm === "elk") {
          // Dynamically import ELK
          const { default: ELK } = await import("elkjs/lib/elk.bundled.js")

          const elk = new ELK()

          // Prepare the graph for ELK
          const graph = {
            id: "root",
            layoutOptions: {
              "elk.algorithm": "layered",
              "elk.direction": options.direction === "TB" ? "DOWN" : "RIGHT",
              "elk.spacing.nodeNode": options.nodeSeparation.toString(),
              "elk.layered.spacing.nodeNodeBetweenLayers": options.rankSeparation.toString(),
            },
            children: nodes.map((node) => ({
              id: node.id,
              width: Number(node.style?.width || 80),
              height: Number(node.style?.height || 80),
            })),
            edges: edges.map((edge) => ({
              id: edge.id,
              sources: [edge.source],
              targets: [edge.target],
            })),
          }

          // Apply the layout
          const elkGraph = await elk.layout(graph);

          // Get the new node positions
          if (elkGraph.children) {
            const layoutedNodes = nodes.map((node) => {
              const elkNode = elkGraph.children?.find((n) => n.id === node.id)
              if (elkNode && elkNode.x !== undefined && elkNode.y !== undefined) {
                return {
                  ...node,
                  position: {
                    x: elkNode.x,
                    y: elkNode.y,
                  },
                }
              }
              return node
            })

            // Update the nodes
            setNodes(layoutedNodes)
          }
        }

        // After layout is applied, fit the view
        setTimeout(() => {
          fitView({ padding: 0.2 })
        }, 50)
      } catch (error) {
        console.error("Error applying layout:", error)
      }
    },
    [nodes, edges, setNodes, setEdges, fitView],
  )

  return (
    <div className="dndflow">
      <div className="flex flex-col h-screen">
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
        </div>

        <OpenDialog open={openDialogOpen} onOpenChange={setOpenDialogOpen} onFileLoaded={handleFileLoaded} />

        <SaveDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          onSave={handleSave}
          petriNetName="Petri Net" //{activePetriNetName}
        />

        {/* ReactFlow Component */}
        <div className="flex-1 reactflow-wrapper" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            nodeTypes={nodeTypes}
            edges={edges}
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
              setTimeout(() => {
                instance.fitView({
                  maxZoom: 4,
                });
              }, 0);
            }}
          >
            <Background />
            <MiniMap />
            <Controls />
            <Panel position="top-center">
              <Toolbar toggleArcMode={toggleArcMode} onApplyLayout={applyLayout}/>
            </Panel>
            <BoomerDial
              slices={slices}
              position={dialPosition}
              isOpen={isDialOpen}
              onClose={() => setIsDialOpen(false)}
              onSliceClick={handleSliceClick}
              size={200}
            ></BoomerDial>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default CPNCanvas;