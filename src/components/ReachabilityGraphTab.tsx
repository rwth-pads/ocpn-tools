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
  useReactFlow,
  MarkerType,
  ReactFlowProvider,
  Panel,
  type NodeProps,
} from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LayoutGrid, ChevronDown } from 'lucide-react';
import type { StateSpaceGraph, StateSpaceResult } from '@/types';
import useStore from '@/stores/store';

type DagreDirection = 'TB' | 'BT' | 'LR' | 'RL';
const DIRECTION_LABELS: Record<DagreDirection, string> = {
  TB: 'Top → Bottom',
  BT: 'Bottom → Top',
  LR: 'Left → Right',
  RL: 'Right → Left',
};

// ─── Layout ──────────────────────────────────────────────────────────────────

const NODE_SIZE = 80;

/** Build React Flow edges from the state space arcs (direction-independent). */
function buildEdges(graph: StateSpaceGraph): Edge[] {
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

  return Array.from(edgeMap.entries()).map(
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
}

/** Build node data (without position) from a state space graph. */
function buildNodeData(graph: StateSpaceGraph) {
  return graph.nodes.map((sn) => {
    const markingEntries = Object.entries(sn.marking);
    const tokens =
      markingEntries.length === 0
        ? '∅'
        : markingEntries.map(([, t]) => t.length).join(', ');
    return { sn, tokens };
  });
}

/** Simple grid layout (fallback). */
function gridLayout(graph: StateSpaceGraph): Node[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(graph.nodes.length)));
  const spacingX = 200;
  const spacingY = 160;

  return buildNodeData(graph).map(({ sn, tokens }, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    return {
      id: String(sn.id),
      position: { x: col * spacingX, y: row * spacingY },
      data: { label: `S${sn.id}`, tokens, marking: sn.marking, time: sn.time },
      type: 'stateNode',
      style: { width: NODE_SIZE, height: NODE_SIZE },
    };
  });
}

/** Dagre-based hierarchical layout. */
async function dagreLayout(
  graph: StateSpaceGraph,
  direction: DagreDirection,
): Promise<Node[]> {
  const DagreModule = await import('@dagrejs/dagre');
  const Dagre = DagreModule.default ?? DagreModule;
  const g = new Dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 60,
    ranksep: 80,
    ranker: 'network-simplex',
  });
  g.setDefaultEdgeLabel(() => ({}));

  const nodeData = buildNodeData(graph);

  for (const { sn } of nodeData) {
    g.setNode(String(sn.id), { width: NODE_SIZE, height: NODE_SIZE });
  }
  for (const arc of graph.arcs) {
    g.setEdge(String(arc.from), String(arc.to));
  }

  Dagre.layout(g);

  return nodeData.map(({ sn, tokens }) => {
    const pos = g.node(String(sn.id));
    return {
      id: String(sn.id),
      position: { x: pos.x - NODE_SIZE / 2, y: pos.y - NODE_SIZE / 2 },
      data: { label: `S${sn.id}`, tokens, marking: sn.marking, time: sn.time },
      type: 'stateNode',
      style: { width: NODE_SIZE, height: NODE_SIZE },
    };
  });
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
  const initialNodes = useMemo(() => gridLayout(graph), [graph]);
  const initialEdges = useMemo(() => buildEdges(graph), [graph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();
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

  const applyDagreLayout = useCallback(
    async (direction: DagreDirection) => {
      const laid = await dagreLayout(graph, direction);
      setNodes(laid);
      requestAnimationFrame(() => fitView({ duration: 300 }));
    },
    [graph, setNodes, fitView],
  );

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
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Layout
                  <ChevronDown className="h-3 w-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(Object.entries(DIRECTION_LABELS) as [DagreDirection, string][]).map(
                  ([dir, label]) => (
                    <DropdownMenuItem key={dir} onClick={() => applyDagreLayout(dir)}>
                      {label}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Badge variant="outline" className="text-xs">
              {graph.nodes.length} states, {graph.arcs.length} arcs
              {!result.report.isFull && ' (partial)'}
            </Badge>
          </div>
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
