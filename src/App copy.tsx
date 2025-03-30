import { useState, useRef, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { initialNodes, nodeTypes } from './nodes';
import { initialEdges, edgeTypes } from './edges';

import CustomConnectionLine from './edges/CustomConnectionLine';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from '@/components/ui/button';
import { Toggle } from './components/ui/toggle';
import { Separator } from '@/components/ui/separator';

import { Circle, Square, MoveRight, Play } from 'lucide-react';

import { DnDProvider, useDnD } from './utils/DnDContext';

let id = 0;
const getId = () => `dndnode_${id++}`;
 
const DnDFlow = ({ isArcMode }) => {  
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();
  const [type] = useDnD();
 
  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );
 
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const [_, setType] = useDnD();
 
  const onDragStart = (event, nodeType) => {
    setType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };
 
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
 
      // Check if the dropped element is valid
      if (!type || typeof type !== 'string') {
        return;
      }
 
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: getId(),
        type, // Ensure `type` is a string
        position,
        data: { label: `${type}` },
      };
 
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, type],
  );

  const toggleArcMode = useCallback((state) => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: { ...node.data, isArcMode: state },
      }))
    );
  }, [setNodes]);
 
  return (
    <div className="dndflow">
      <div className="flex flex-col h-screen">
          {/* Toolbar Panel */}
          <div className="flex items-center justify-between p-2 border-b">
            {/* Left Section */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="ghost" size="icon" className="dndnode input" onDragStart={(event) => onDragStart(event, 'place')} draggable>
                        <Circle className="h-4 w-4"/>
                        <span className="sr-only">Add Place</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Place</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="ghost" size="icon" className="dndnode input" onDragStart={(event) => onDragStart(event, 'transition')} draggable>
                        <Square className="h-4 w-4" />
                        <span className="sr-only">Add Transition</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Transition</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                    <Toggle
                      aria-label="Toggle Arc"
                      onPressedChange={toggleArcMode}
                    >
                      <MoveRight className="h-4 w-4" />
                      <span className="sr-only">Add Arc</span>
                    </Toggle>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add Arc</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <div className="flex items-center gap-2 h-6">
                <Separator orientation="vertical" className="mx-1 h-6" />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 h-6">
                <Separator orientation="vertical" className="mx-1 h-6" />
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="ghost" size="icon">
                        <Play className="h-4 w-4" />
                        <span className="sr-only">Start Simulation</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Start Simulation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* ReactFlow Component */}
          <div className="flex-1 reactflow-wrapper" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodes}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              edges={edges}
              edgeTypes={edgeTypes}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              fitView
              defaultEdgeOptions={defaultEdgeOptions}
              connectionLineComponent={CustomConnectionLine}
              onInit={(instance) => {
                setTimeout(() => {
                  instance.fitView({
                    maxZoom: 2,
                  });
                }, 0);
              }}
            >
              <Background />
              <MiniMap />
              <Controls />
            </ReactFlow>
          </div>
        </div>
    </div>
  );
};

const defaultEdgeOptions = {
  type: 'floating',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#000',
    width: 15,
    height: 15,
  },
};

export default function App() {
  const [isArcMode, setIsArcMode] = useState(false);

  return (
    <div className="h-screen">
    <ResizablePanelGroup direction="horizontal">
      {/* Left Panel */}
      <ResizablePanel defaultSize={20}>
        <div>
          <div className="p-4">
            {/* Variables Section */}
            <h2 className="font-bold">Variables</h2>
            {/* Add content for the Variables section here */}
          </div>
          <Separator orientation="horizontal" className="mt-2" />
          <div className="p-4">
            {/* Color Sets Section */}
            <h2 className="font-bold">Color Sets</h2>
            {/* Add content for the Color Sets section here */}
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle />

      {/* Center Panel */}
        <ResizablePanel>
          <ReactFlowProvider>
            <DnDProvider>
              <DnDFlow isArcMode={isArcMode} />
            </DnDProvider>
          </ReactFlowProvider>
        </ResizablePanel>
      <ResizableHandle />

      {/* Right Panel */}
      <ResizablePanel collapsible defaultSize={20}>
        <div className="p-4">
          <h2 className="font-bold">Properties</h2>
          {/* Add content for the right panel here */}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
    </div>
  );
}
