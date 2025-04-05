import React, { useRef, useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';

import Dagre from '@dagrejs/dagre';

import '@xyflow/react/dist/style.css';

import { Toolbar } from "@/components/Toolbar";

import CustomConnectionLine from '../edges/CustomConnectionLine';
import { useDnD } from '../utils/DnDContext';

import useStore from '@/stores/store';

import { nodeTypes } from '../nodes';
import { edgeTypes } from '../edges';

const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  onConnect: state.onConnect,
  setSelectedElement: state.setSelectedElement,
  toggleArcMode: state.toggleArcMode,
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

const getLayoutedElements = (nodes, edges, options) => {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: options.direction });
 
  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) =>
    g.setNode(node.id, {
      ...node,
      width: node.measured?.width ?? 0,
      height: node.measured?.height ?? 0,
    }),
  );
 
  Dagre.layout(g);
 
  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      const x = position.x - (node.measured?.width ?? 0) / 2;
      const y = position.y - (node.measured?.height ?? 0) / 2;
 
      return { ...node, position: { x, y } };
    }),
    edges,
  };
};

const CPNCanvas = () => {
  const reactFlowWrapper = useRef(null);
  
  const { nodes, edges, onNodesChange, onEdgesChange, setNodes, setEdges, onConnect, setSelectedElement, toggleArcMode } = useStore(
    useShallow(selector),
  );

  const { fitView, screenToFlowPosition } = useReactFlow();
  const [type, setType] = useDnD();

  // const onConnect = useCallback(
  //   (connection) => setEdges((eds) => addEdge(connection, eds)),
  //   [setEdges]
  // );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDragStart = (event, nodeType) => {
    setType(nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event) => {
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
        data: { label: `${type}` },
      };

      useStore.getState().addNode(newNode);
    },
    [screenToFlowPosition, type]
  );

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedElement({ type: "node", element: node })
  }, [setSelectedElement]);

  // Handle edge selection
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: any) => {
    setSelectedElement({ type: "edge", element: edge })
  }, [setSelectedElement])

  // Handle background click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedElement(null)
  }, [setSelectedElement])

  const onLayout = useCallback(
    () => {
      const direction = 'LR';
      const layouted = getLayoutedElements(nodes, edges, { direction });
 
      setNodes([...layouted.nodes]);
      setEdges([...layouted.edges]);
 
      fitView();
    },
    [nodes, edges],
  );

  return (
    <div className="dndflow">
      <div className="flex flex-col h-screen">
        {/* Toolbar Panel */}
        <div className="flex items-center justify-between p-2 border-b">
          {/* Add toolbar buttons here */}
        </div>

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
              <Toolbar toggleArcMode={toggleArcMode} layoutGraph={onLayout} />
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default CPNCanvas;