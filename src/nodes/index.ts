import { PlaceNode } from './PlaceNode';
import TransitionNode from './TransitionNode';

export const initialNodes = [
  { id: 'a',
    type: 'place',
    position: { x: -200, y: 0 },
    data: { label: 'start', colorSet: 'INT', initialMarking: '0' }
  },
  {
    id: 'b',
    type: 'transition',
    position: { x: -100, y: 100 },
    width: 50,
    height: 30,
    data: { label: 'transition', guard: '', time: '', priority: '', codeSegment: '' },
  },
  {
    id: 'c',
    type: 'place',
    position: { x: 0, y: 200 },
    width: 50,
    height: 30,
    data: { label: 'end place', colorSet: 'INT', initialMarking: '0' },
  },
];

export const nodeTypes = {
  'place': PlaceNode,
  'transition': TransitionNode,
};
