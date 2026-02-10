import { useCallback } from 'react';
import {
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  OnNodesChange,
  OnEdgesChange,
  Connection,
  OnConnect,
} from '@xyflow/react';
import useStore, { StoreState } from '@/stores/store';
import { v4 as uuidv4 } from 'uuid';

export function usePetriNetHandlers(petriNetId: string) {
  const setNodes = useStore((state: StoreState) => state.setNodes);
  const setEdges = useStore((state: StoreState) => state.setEdges);

  const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    const currentNodes = useStore.getState().petriNetsById[petriNetId]?.nodes || [];
    const updatedNodes = applyNodeChanges(changes, currentNodes);
    setNodes(petriNetId, updatedNodes);
  }, [petriNetId, setNodes]);

  const onEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
    const currentEdges = useStore.getState().petriNetsById[petriNetId]?.edges || [];
    const updatedEdges = applyEdgeChanges(changes, currentEdges);
    setEdges(petriNetId, updatedEdges);
  }, [petriNetId, setEdges]);

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    const state = useStore.getState();
    const arcType = state.activeArcType;
    const newEdge = {
      ...connection,
      id: uuidv4(),
      type: 'floating', // or your custom edge type like 'floating', 'bezier', etc.
      label: '',
      animated: false,
      data: arcType !== 'normal' ? { arcType } : undefined,
    };
    const currentEdges = state.petriNetsById[petriNetId]?.edges || [];
    setEdges(petriNetId, [...currentEdges, newEdge]);
  }, [petriNetId, setEdges]);

  return { onNodesChange, onEdgesChange, onConnect };
}
