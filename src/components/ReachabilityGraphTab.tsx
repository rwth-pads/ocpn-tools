import { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  Panel,
  type NodeProps,
} from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import type { StateSpaceGraph, StateSpaceResult } from '@/types';
import useStore from '@/stores/store';

// ─── Layout ──────────────────────────────────────────────────────────────────

function layoutNodes(graph: StateSpaceGraph): { nodes: Node[]; edges: Edge[] } {
  const cols = Math.max(1, Math.ceil(Math.sqrt(graph.nodes.length)));
  const spacingX = 200;
  const spacingY = 160;

  const nodes: Node[] = graph.nodes.map((sn, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const markingEntries = Object.entries(sn.marking);
    const tokens =
      markingEntries.length === 0
        ? '∅'
        : markingEntries.map(([, t]) => t.length).join(', ');

    return {
      id: String(sn.id),
      position: { x: col * spacingX, y: row * spacingY },
      data: {
        label: `S${sn.id}`,
        tokens,
        marking: sn.marking,
        time: sn.time,
      },
      type: 'stateNode',
      style: { width: 80, height: 80 },
    };
  });

  // Merge duplicate edges (same from→to) into one with combined label
  const edgeMap = new Map<string, { from: number; to: number; labels: string[] }>();
  for (const arc of graph.arcs) {
    const key = `${arc.from}-${arc.to}`;
    const existing = edgeMap.get(key);
    const arcLabel = arc.binding
      ? `${arc.transitionName} [${arc.binding}]`
      : arc.transitionName;
    if (existing) {
      existing.labels.push(arcLabel);
    } else {
      edgeMap.set(key, { from: arc.from, to: arc.to, labels: [arcLabel] });
    }
  }

  const edges: Edge[] = Array.from(edgeMap.entries()).map(
    ([key, { from, to, labels }]) => ({
      id: `e-${key}`,
      source: String(from),
      target: String(to),
      label:
        labels.length <= 2
          ? labels.join('\n')
          : `${labels[0]} +${labels.length - 1}`,
      type: 'default',
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
      style: { strokeWidth: 1.5 },
      labelStyle: { fontSize: 9, fill: '#666' },
    }),
  );

  return { nodes, edges };
}

// ─── Marking Popover ─────────────────────────────────────────────────────────

interface MarkingPopoverProps {
  marking: Record<string, string[]>;
  time: number;
  stateId: string;
  placeNames: Map<string, string>;
  position: { x: number; y: number };
  onClose: () => void;
}

function MarkingPopover({
  marking,
  time,
  stateId,
  placeNames,
  position,
  onClose,
}: MarkingPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as globalThis.Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const entries = Object.entries(marking);

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-popover border rounded-lg shadow-lg p-3 text-xs min-w-[200px] max-w-[360px]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="font-semibold text-sm mb-1.5">
        State {stateId}{time > 0 ? ` @ ${time}` : ''}
      </div>
      <div className="space-y-0.5">
        {entries.length === 0 ? (
          <div className="text-muted-foreground italic">Empty marking</div>
        ) : (
          entries.map(([placeId, tokens]) => (
            <div key={placeId} className="flex gap-1.5">
              <span className="font-medium text-foreground shrink-0">
                {placeNames.get(placeId) || placeId}:
              </span>
              <span className="text-muted-foreground break-all">
                {tokens.length}'{tokens.length <= 8 ? `(${tokens.join(', ')})` : `(${tokens.slice(0, 6).join(', ')}, …)`}
              </span>
            </div>
          ))
        )}
      </div>
      {/* Also show places with zero tokens */}
      {(() => {
        const presentPlaces = new Set(Object.keys(marking));
        const emptyPlaces = Array.from(placeNames.entries()).filter(
          ([id]) => !presentPlaces.has(id),
        );
        if (emptyPlaces.length === 0) return null;
        return emptyPlaces.map(([id, name]) => (
          <div key={id} className="flex gap-1.5 text-muted-foreground/60">
            <span className="font-medium shrink-0">{name}:</span>
            <span>empty</span>
          </div>
        ));
      })()}
    </div>
  );
}

// ─── State Node ──────────────────────────────────────────────────────────────

type StateNodeData = {
  label: string;
  tokens: string;
  marking: Record<string, string[]>;
  time: number;
};

function StateNodeComponent({ data }: NodeProps<Node<StateNodeData>>) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full rounded-full border-2 border-primary bg-background text-center shadow-sm">
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
      <span className="font-semibold text-sm leading-none">{data.label}</span>
      <span className="text-[10px] text-muted-foreground mt-0.5">
        {data.tokens}
      </span>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-transparent !border-0 !w-0 !h-0"
      />
    </div>
  );
}

const nodeTypes = { stateNode: StateNodeComponent };

// ─── Content ─────────────────────────────────────────────────────────────────

function ReachabilityGraphContent({
  graph,
  result,
}: {
  graph: StateSpaceGraph;
  result: StateSpaceResult;
}) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutNodes(graph),
    [graph],
  );

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const petriNetsById = useStore((state) => state.petriNetsById);

  // Popover state
  const [popover, setPopover] = useState<{
    marking: Record<string, string[]>;
    time: number;
    stateId: string;
    position: { x: number; y: number };
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build place name lookup
  const placeNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const net of Object.values(petriNetsById)) {
      for (const node of net.nodes) {
        if (node.type === 'place') {
          names.set(node.id, (node.data?.label as string) || node.id);
        }
      }
    }
    return names;
  }, [petriNetsById]);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const marking = node.data?.marking as
        | Record<string, string[]>
        | undefined;
      const time = (node.data?.time as number) ?? 0;
      if (!marking || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      setPopover({
        marking,
        time,
        stateId: node.id,
        position: {
          x: event.clientX - rect.left + 12,
          y: event.clientY - rect.top + 12,
        },
      });
    },
    [],
  );

  const closePopover = useCallback(() => setPopover(null), []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={closePopover}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls showInteractive={false} />
        <Panel position="top-right">
          <Badge variant="outline" className="text-xs">
            {graph.nodes.length} states, {graph.arcs.length} arcs
            {!result.report.isFull && ' (partial)'}
          </Badge>
        </Panel>
      </ReactFlow>

      {popover && (
        <MarkingPopover
          marking={popover.marking}
          time={popover.time}
          stateId={popover.stateId}
          placeNames={placeNames}
          position={popover.position}
          onClose={closePopover}
        />
      )}
    </div>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

export function ReachabilityGraphTab() {
  const stateSpaceResult = useStore((state) => state.stateSpaceResult);

  if (!stateSpaceResult?.graph) {
    return (
      <div className="flex items-center justify-center w-full h-full text-muted-foreground">
        No state space calculated yet.
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <ReachabilityGraphContent
        graph={stateSpaceResult.graph}
        result={stateSpaceResult}
      />
    </ReactFlowProvider>
  );
}
