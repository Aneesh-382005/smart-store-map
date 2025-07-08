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
            [key: string]: string | number;
        };
    };
    selected: boolean;
};

export default function CustomNode({ id, data, selected }: CustomNodeProps) {
    const { setNodes } = useReactFlow();
    
    const aspectRatio = data.width && data.height ? data.width / data.height : 1;
    const { width = 150, height = 150, color, metadata } = data;

    // Update node with new data
    const updateNode = useCallback((updates: Partial<{ data: Partial<CustomNodeProps['data']>; style: Record<string, number> }>) => {
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
        const newArea = size.width * size.height; // Simple area calculation
        updateNode({
            data: { width: size.width, height: size.height, metadata: { ...metadata, area: newArea } },
            style: { width: size.width, height: size.height }
        });
    }, [updateNode, metadata]);

    // Auto-resize when area changes (only if area doesn't match current size)
    useEffect(() => {
        if (metadata.area > 0) {
            const currentArea = width * height;
            
            // Only auto-resize if area significantly differs from current calculated area
            if (Math.abs(metadata.area - currentArea) > 500) {
                const newWidth = Math.sqrt(metadata.area * aspectRatio);
                const newHeight = newWidth / aspectRatio;
                
                updateNode({
                    data: { width: newWidth, height: newHeight },
                    style: { width: newWidth, height: newHeight }
                });
            }
        }
    }, [metadata.area, aspectRatio, height, width, updateNode]);
    
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