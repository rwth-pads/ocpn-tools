import { memo } from 'react';

// Types of inscriptions
export type InscriptionType = 
  | 'colorSet'      // Place color set type
  | 'initialMarking' // Place initial marking
  | 'guard'         // Transition guard condition
  | 'time'          // Transition time
  | 'priority'      // Transition priority
  | 'codeSegment'   // Transition code segment
  | 'arcLabel';     // Arc inscription

export interface InscriptionNodeData {
  label: string;
  inscriptionType: InscriptionType;
  color?: string; // Optional color for the inscription text
  [key: string]: unknown; // Index signature for React Flow compatibility
}

export interface InscriptionNodeProps {
  data: InscriptionNodeData;
}

/**
 * InscriptionNode - A draggable text label that stays relative to its parent node.
 * Used for colorSet, initialMarking, guards, time, priority, arc labels, etc.
 * 
 * When the parent node moves, this inscription moves with it.
 * The inscription can be independently repositioned by dragging.
 */
export const InscriptionNode: React.FC<InscriptionNodeProps> = ({ data }) => {
  const textColor = data.color || 'inherit';
  
  return (
    <div 
      className="inscription-node font-mono text-[9px] whitespace-pre-wrap cursor-move select-none"
      style={{ color: textColor }}
    >
      {data.label}
    </div>
  );
};

export default memo(InscriptionNode);
