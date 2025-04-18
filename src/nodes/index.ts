import { PlaceNode } from './PlaceNode';
import TransitionNode from './TransitionNode';
import AuxTextNode from './AuxTextNode';

export const initialNodes = [
  { id: 'a',
    type: 'place',
    position: { x: -200, y: 0 },
    data: { label: 'start', colorSet: 'INT', initialMarking: '[1, 5, 5, 10]' }
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
    data: { label: 'end place', colorSet: 'INT' },
  },
];

export const nodeTypes = {
  'place': PlaceNode,
  'transition': TransitionNode,
  'auxText': AuxTextNode,
};
