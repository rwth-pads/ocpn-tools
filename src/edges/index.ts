import type { Edge, EdgeTypes } from '@xyflow/react';
import FloatingEdge from './FloatingEdge';

export const initialEdges: Edge[] = [
  { id: 'a->b', source: 'a', target: 'b'},
  { id: 'b->c', source: 'b', target: 'c' },
];

export const edgeTypes = {
  floating: FloatingEdge,
} satisfies EdgeTypes;
