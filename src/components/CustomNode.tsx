import { useReactFlow } from "reactflow";
import React, { useEffect, useCallback } from "react";
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

export default function CustomNode({ id, data, selected }: CustomNodeProps) {
    const { setNodes } = useReactFlow();
    
    const aspectRatio = data.width && data.height ? data.width / data.height : 1;
    const scale = 2;
    const { width = 150, height = 150, color, metadata } = data;

    // Update node with new data
    const updateNode = useCallback((updates: any) => {
        setNodes((nodes) =>
            nodes.map((node) =>
                node.id === id
                    ? { ...node, ...updates, data: { ...node.data, ...updates.data } }
                    : node
            )
        );
    }, [id, setNodes]);

    // Handle resize from NodeResizer
    const handleResize = useCallback((size: { width: number; height: number }) => {
        const newArea = Math.round((size.width * size.height) / (scale * scale));
        updateNode({
            data: { width: size.width, height: size.height, metadata: { ...metadata, area: newArea } },
            style: { width: size.width, height: size.height }
        });
    }, [updateNode, metadata, scale]);

    // Auto-resize when area changes
    useEffect(() => {
        if (metadata.area > 0) {
            const newWidth = Math.sqrt(metadata.area * aspectRatio) * scale;
            const newHeight = newWidth / aspectRatio;
            
            if (Math.abs(newWidth - width) > 5 || Math.abs(newHeight - height) > 5) {
                updateNode({
                    data: { width: newWidth, height: newHeight },
                    style: { width: newWidth, height: newHeight }
                });
            }
        }
    }, [metadata.area, aspectRatio, scale, width, height, updateNode]);
    
    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: color,
            borderRadius: '4px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxSizing: 'border-box',
        }}>
            <Handle type="target" position={Position.Top} />
            <Handle type="source" position={Position.Bottom} />
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
            
            {selected && (
                <NodeResizer
                    minWidth={50}
                    minHeight={50}
                    onResizeEnd={(event, size) => handleResize(size)}
                    onResize={(event, size) => handleResize(size)}
                />
            )}
            
            <div style={{ 
                fontWeight: 'bold', 
                textAlign: 'center',
                padding: '8px',
                color: 'white',
                textShadow: '1px 1px 2px rgba(0,0,0,0.7)',
                fontSize: '14px',
                userSelect: 'none'
            }}>
                {metadata.name}
            </div>
        </div>
    );
}