import { useReactFlow } from "reactflow";
import React, { useState, useEffect } from "react";
import { NodeResizer, Handle, Position } from 'reactflow';
import '@reactflow/node-resizer/dist/style.css'

type CustomNodeProps = {
    id: string;
    data: {
        label: string;
        color: string;
        width?: number;
        height?: number;
        metadata: {
            name: string;
            description: string;
            area: number;
            [key: string]: any;
        };
    };
    selected: boolean;
};

export default function CustomNode({ id, data, selected }: CustomNodeProps)
{
    const { setNodes } = useReactFlow()
    
    const [label, setLabel] = useState(data.label)
    const [color, setColor] = useState(data.color)
    const [metadata, setMetadata] = useState(data.metadata)
    const [width, setWidth] = useState(data.width || 150);
    const [height, setHeight] = useState(data.height || 150);

    const aspectRatio = width / height || 1;
    const scale = 2;
    
      useEffect(() => {
        if (metadata.area > 0) {
            const newWidth = Math.sqrt(metadata.area * aspectRatio) * scale;
            const newHeight = newWidth / aspectRatio;
            setWidth(newWidth);
            setHeight(newHeight);
    }
  }, [metadata.area]);

    useEffect(() => {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === id
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    label,
                    color,
                    metadata,
                    width,
                    height,
                  },
                }
              : node
          )
        );
      }, [label, color, metadata, width, height, id, setNodes]);
    
    const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => setLabel(e.target.value);
    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value);
    const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => 
    {
        const { name, value } = e.target;
        setMetadata({ ...metadata, [name]: value });
    }

    return (
    <div
      style={{
        width,
        height,
        background: color,
        border: '2px solid #333',
        padding: '8px',
        borderRadius: '4px',
        overflow: 'hidden',
        opacity: 1,
      }}
    >
      {/* Connection handles for creating edges */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      {selected && (
        <NodeResizer
          minWidth={50}
          minHeight={50}
          onResizeEnd={(e, size) => {
            setWidth(size.width);
            setHeight(size.height);
          }}
        />
      )}
      <input value={label} onChange={handleLabelChange} placeholder="Label" />
      <input type="color" value={color} onChange={handleColorChange} />
      <input name="name" value={metadata.name} onChange={handleMetadataChange} placeholder="Name" />
      <textarea
        name="description"
        value={metadata.description}
        onChange={handleMetadataChange}
        placeholder="Description"
      />
      <input
        type="number"
        name="area"
        value={metadata.area}
        onChange={handleMetadataChange}
        placeholder="Area"
      />
    </div>
  );
}