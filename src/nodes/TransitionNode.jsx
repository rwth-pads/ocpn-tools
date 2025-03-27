import { memo } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';

const TransitionNode = ({ data, selected }) => {

    return (
        <div className="cpn-node transition-node">
            <NodeResizer
                isVisible={selected}
                minWidth={15}
                minHeight={30}
            />
            <label htmlFor="text">{data.label}</label>
            <Handle type="source" position={Position.Right} />
            <Handle type="target" position={Position.Left} />
        </div>
    )
}

export default memo(TransitionNode);
