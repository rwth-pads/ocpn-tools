import type { Edge, EdgeTypes } from '@xyflow/react';
import ArcEdge from './ArcEdge';

export const initialEdges: Edge[] = [
  { id: 'a->b', source: 'a', target: 'b', label: 'var1' },
  { id: 'b->c', source: 'b', target: 'c', label: 'var1' },
];

export const edgeTypes = {
  floating: ArcEdge,
} satisfies EdgeTypes;
