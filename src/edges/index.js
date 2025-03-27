import FloatingEdge from "./FloatingEdge";

export const initialEdges = [
  { id: 'a->c', source: 'a', target: 'c', animated: true },
  { id: 'b->d', source: 'b', target: 'd' },
  { id: 'c->d', source: 'c', target: 'd', animated: true },
];

export const edgeTypes = {
  floating: FloatingEdge,
};
