import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  MarkerType,
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
import { Separator } from '@/components/ui/separator';

import { Circle, Square, MoveRight, Play } from 'lucide-react';

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
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const onConnect = useCallback(
    (connection) => setEdges((edges) => addEdge(connection, edges)),
    [setEdges]
  );

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
        <div className="flex flex-col h-screen">
          {/* Toolbar Panel */}
          <div className="flex items-center justify-between p-2 border-b">
            {/* Left Section */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button variant="ghost" size="icon">
                        <Circle className="h-4 w-4" />
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
                      <Button variant="ghost" size="icon">
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
                      <Button variant="ghost" size="icon">
                        <MoveRight className="h-4 w-4" />
                        <span className="sr-only">Add Arc</span>
                      </Button>
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
          <div className="flex-1">
            <ReactFlow
              nodes={nodes}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              edges={edges}
              edgeTypes={edgeTypes}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
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
      </ResizablePanel>
      <ResizableHandle />

      {/* Right Panel */}
      <ResizablePanel collapsible defaultSize={20}>
        <div className="p-4">
          <h2 className="font-bold">Transition Properties</h2>
          {/* Add content for the right panel here */}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
    </div>
  );
}
