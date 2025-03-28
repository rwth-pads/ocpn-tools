import type { Edge, EdgeTypes } from '@xyflow/react';
import FloatingEdge from './FloatingEdge';

export const initialEdges: Edge[] = [
  { id: 'a->b', source: 'a', target: 'b', label: 'var' },
  { id: 'b->c', source: 'b', target: 'c', label: 'var' },
];

export const edgeTypes = {
  floating: FloatingEdge,
} satisfies EdgeTypes;
