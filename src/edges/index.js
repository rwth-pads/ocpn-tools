import FloatingEdge from "./FloatingEdge";

export const initialEdges = [
  { id: 'a->b', source: 'a', target: 'b'},
  { id: 'b->c', source: 'b', target: 'c' },
];

export const edgeTypes = {
  floating: FloatingEdge,
};
