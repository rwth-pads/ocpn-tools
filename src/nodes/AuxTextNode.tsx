// Export the interface so it can be imported elsewhere
export interface AuxTextNodeData {
  label: string;
}

export interface AuxTextNodeProps {
  id: string;
  data: AuxTextNodeData;
  selected: boolean;
}

export const AuxTextNode: React.FC<AuxTextNodeProps> = ({ data }) => {

  return (
    <div className="cpn-node auxtext-node">
      {data.label}
    </div>
  );
};

export default AuxTextNode;
