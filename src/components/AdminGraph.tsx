import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
    addEdge, 
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Connection,
    useReactFlow,
    Node
} from 'reactflow'
import { ReactFlowProvider } from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode'
import { supabase } from '../utils/supabaseClient';

const nodeTypes = { custom: CustomNode }

export default function AdminGraph() 
{
    return (
        <ReactFlowProvider>
            <AdminGraphContent />
        </ReactFlowProvider>
    )
}

function AdminGraphContent()
{
    const { project } = useReactFlow();
    const [ nodes, setNodes, onNodesChange ] = useNodesState([]);
    const [ edges, setEdges, onEdgesChange ] = useEdgesState([]);
    const [ selectedNode, setSelectedNode ] = useState<Node | null>(null);
    const [ history, setHistory ] = useState<{ nodes: any[], edges: any[] }[]>([]);
    const [ historyIndex, setHistoryIndex ] = useState(-1);
    
    // Keep selected node in sync with actual node data
    useEffect(() => {
        if (selectedNode) {
            const updatedNode = nodes.find(node => node.id === selectedNode.id);
            if (updatedNode && JSON.stringify(updatedNode) !== JSON.stringify(selectedNode)) {
                setSelectedNode(updatedNode);
            }
        }
    }, [nodes, selectedNode]);

    // Save current state for undo/redo
    const saveToHistory = useCallback(() => {
        const newState = { nodes: [...nodes], edges: [...edges] };
        const trimmedHistory = history.slice(0, historyIndex + 1);
        trimmedHistory.push(newState);
        setHistory(trimmedHistory);
        setHistoryIndex(trimmedHistory.length - 1);
    }, [nodes, edges, history, historyIndex]);

    // Undo/Redo functions
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const previousState = history[historyIndex - 1];
            setNodes(previousState.nodes);
            setEdges(previousState.edges);
            setHistoryIndex(historyIndex - 1);
        }
    }, [historyIndex, history, setNodes, setEdges]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setNodes(nextState.nodes);
            setEdges(nextState.edges);
            setHistoryIndex(historyIndex + 1);
        }
    }, [historyIndex, history, setNodes, setEdges]);

    // Delete selected nodes and edges
    const deleteSelected = useCallback(() => {
        const selectedNodes = nodes.filter(node => node.selected);
        const selectedEdges = edges.filter(edge => edge.selected);
        
        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
            saveToHistory(); // Save current state before deletion
            
            // Remove selected nodes
            if (selectedNodes.length > 0) {
                const nodeIdsToDelete = selectedNodes.map(node => node.id);
                setNodes(nds => nds.filter(node => !nodeIdsToDelete.includes(node.id)));
                
                // Also remove edges connected to deleted nodes
                setEdges(eds => eds.filter(edge => 
                    !nodeIdsToDelete.includes(edge.source) && 
                    !nodeIdsToDelete.includes(edge.target)
                ));
                
                // Clear selected node if it was deleted
                if (selectedNode && nodeIdsToDelete.includes(selectedNode.id)) {
                    setSelectedNode(null);
                }
            }
            
            // Remove selected edges
            if (selectedEdges.length > 0) {
                const edgeIdsToDelete = selectedEdges.map(edge => edge.id);
                setEdges(eds => eds.filter(edge => !edgeIdsToDelete.includes(edge.id)));
            }
        }
    }, [nodes, edges, selectedNode, saveToHistory, setNodes, setEdges]);

    // Keyboard event handler
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Delete key
            if (event.key === 'Delete' || event.key === 'Backspace') {
                event.preventDefault();
                deleteSelected();
            }
            // Undo (Ctrl+Z)
            else if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                undo();
            }
            // Redo (Ctrl+Shift+Z or Ctrl+Y)
            else if ((event.ctrlKey && event.shiftKey && event.key === 'Z') || 
                     (event.ctrlKey && event.key === 'y')) {
                event.preventDefault();
                redo();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [deleteSelected, undo, redo]);

    const addNewNode = () =>
    {
        saveToHistory(); // Save current state before adding
        
        const id = (nodes.length + 1).toString();
        const width = 150;
        const height = 150;
        const newNode = {
            id,
            type: 'custom',
            position: { x: Math.random() * 250, y: Math.random() * 250 },
            style: { width, height },
            data: {
                label: `Node ${id}`,
                color: '#00BFFF',
                width,
                height,
                metadata: {
                    name: `Node ${id}`,
                    description: `Description for Node ${id}`,
                    area: 1000
                }
            }
        }
        setNodes((nds) => nds.concat(newNode));
    }
        

    const onConnect = useCallback(
    (params: Connection) => {
        saveToHistory(); // Save before adding edge
        setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, saveToHistory])

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const updateSelectedNodeMetadata = (field: string, value: any) => {
        if (!selectedNode) return;
        
        setNodes((nds) =>
            nds.map((node) =>
                node.id === selectedNode.id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            metadata: {
                                ...node.data.metadata,
                                [field]: value
                            }
                        }
                    }
                    : node
            )
        );
    };

    const updateSelectedNodeStyle = (field: string, value: any) => {
        if (!selectedNode) return;
        
        setNodes((nds) =>
            nds.map((node) =>
                node.id === selectedNode.id
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            [field]: value
                        },
                        style: {
                            ...node.style,
                            [field]: value
                        }
                    }
                    : node
            )
        );
    };

    const saveGraph = async () => {
        const { error } = await supabase.from('maps').insert([
            {
                name: 'MyCustomMap',
                graph_json: JSON.stringify({nodes, edges})
            }
        ])
        if (error) console.error('Error saving graph:', error)
        else alert('Graph saved to supabase')
    }
    return (
        <div style={{ width: '100vw', height: '90vh', display: 'flex' }}>
            <div style={{ flex: 1 }}>
                <div className="flex space-x-2 p-2">
                <button onClick={addNewNode} className="p-2 bg-green-600 text-white rounded">
                    ➕ Add Node
                </button>
                <button 
                    onClick={deleteSelected} 
                    className="p-2 bg-red-600 text-white rounded"
                    title="Delete selected (Del key)"
                >
                    🗑️ Delete
                </button>
                <button 
                    onClick={undo} 
                    disabled={historyIndex <= 0}
                    className="p-2 bg-gray-600 text-white rounded disabled:bg-gray-400"
                    title="Undo (Ctrl+Z)"
                >
                    ↶ Undo
                </button>
                <button 
                    onClick={redo} 
                    disabled={historyIndex >= history.length - 1}
                    className="p-2 bg-gray-600 text-white rounded disabled:bg-gray-400"
                    title="Redo (Ctrl+Shift+Z)"
                >
                    ↷ Redo
                </button>
                <button onClick={saveGraph} className="p-2 bg-blue-600 text-white rounded">
                    💾 Save to Supabase
                </button>
                </div>
                <div style={{ width: '100%', height: '100%' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    fitView
                    nodeTypes={nodeTypes}
                    selectNodesOnDrag={false}
                    nodeDragThreshold={1}
                    multiSelectionKeyCode="Control"
                    deleteKeyCode="Delete"
                >
                    <MiniMap />
                    <Controls />
                    <Background />
                </ReactFlow>
                </div>
            </div>
            
            {/* Metadata Panel */}
            {selectedNode && (
                <div style={{ 
                    width: '300px', 
                    background: '#f5f5f5', 
                    padding: '20px',
                    borderLeft: '1px solid #ccc',
                    overflowY: 'auto'
                }}>
                    <h3 style={{ marginTop: 0 }}>Node Properties</h3>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button 
                            onClick={() => setSelectedNode(null)}
                            style={{ 
                                background: '#ff4444', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '3px',
                                padding: '5px 10px',
                                cursor: 'pointer'
                            }}
                        >
                            ✕ Close
                        </button>
                        <button 
                            onClick={() => {
                                if (selectedNode) {
                                    saveToHistory();
                                    setNodes(nds => nds.filter(node => node.id !== selectedNode.id));
                                    setEdges(eds => eds.filter(edge => 
                                        edge.source !== selectedNode.id && edge.target !== selectedNode.id
                                    ));
                                    setSelectedNode(null);
                                }
                            }}
                            style={{ 
                                background: '#dc2626', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '3px',
                                padding: '5px 10px',
                                cursor: 'pointer'
                            }}
                        >
                            🗑️ Delete Node
                        </button>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Name:
                        </label>
                        <input
                            type="text"
                            value={selectedNode.data.metadata.name}
                            onChange={(e) => updateSelectedNodeMetadata('name', e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Label:
                        </label>
                        <input
                            type="text"
                            value={selectedNode.data.label}
                            onChange={(e) => {
                                setNodes((nds) =>
                                    nds.map((node) =>
                                        node.id === selectedNode.id
                                            ? { ...node, data: { ...node.data, label: e.target.value } }
                                            : node
                                    )
                                );
                            }}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Description:
                        </label>
                        <textarea
                            value={selectedNode.data.metadata.description}
                            onChange={(e) => updateSelectedNodeMetadata('description', e.target.value)}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                minHeight: '80px'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Area:
                        </label>
                        <input
                            type="number"
                            value={selectedNode.data.metadata.area}
                            onChange={(e) => {
                                const newArea = parseInt(e.target.value) || 0;
                                updateSelectedNodeMetadata('area', newArea);
                            }}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Width:
                        </label>
                        <input
                            type="number"
                            value={selectedNode.data.width || 150}
                            onChange={(e) => updateSelectedNodeStyle('width', parseInt(e.target.value) || 150)}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Height:
                        </label>
                        <input
                            type="number"
                            value={selectedNode.data.height || 150}
                            onChange={(e) => updateSelectedNodeStyle('height', parseInt(e.target.value) || 150)}
                            style={{ 
                                width: '100%', 
                                padding: '8px', 
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Color:
                        </label>
                        <input
                            type="color"
                            value={selectedNode.data.color}
                            onChange={(e) => {
                                setNodes((nds) =>
                                    nds.map((node) =>
                                        node.id === selectedNode.id
                                            ? { ...node, data: { ...node.data, color: e.target.value } }
                                            : node
                                    )
                                );
                            }}
                            style={{ 
                                width: '100%', 
                                height: '40px',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
                        <strong>Node ID:</strong> {selectedNode.id}<br/>
                        <strong>Position:</strong> ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})<br/>
                        <strong>Size:</strong> {selectedNode.data.width || selectedNode.style?.width || 150} × {selectedNode.data.height || selectedNode.style?.height || 150}<br/>
                        <strong>Area:</strong> {selectedNode.data.metadata.area}
                    </div>
                </div>
            )}
        </div>
    )

}

