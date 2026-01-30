// Export the interface so it can be imported elsewhere
export interface AuxTextNodeData {
  label: string;
  color?: string;
  bold?: boolean;
}

export interface AuxTextNodeProps {
  id: string;
  data: AuxTextNodeData;
  selected: boolean;
}

export const AuxTextNode: React.FC<AuxTextNodeProps> = ({ data }) => {
  const style: React.CSSProperties = {
    color: data.color || 'inherit',
    fontWeight: data.bold ? 'bold' : 'normal',
    // Center the text at the node position
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    whiteSpace: 'pre-wrap',
    textAlign: 'center',
    fontSize: '9px',
  };

  return (
    <div className="cpn-node auxtext-node" style={style}>
      {data.label}
    </div>
  );
};

export default AuxTextNode;
