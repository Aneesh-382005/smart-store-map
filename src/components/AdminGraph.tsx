import React, { useCallback } from 'react';
import ReactFlow, {
    addEdge, 
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Connection,
    useReactFlow
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
    const [ nodes, setNodes, onNodesChange ] = useNodesState([]);
    const [ edges, setEdges, onEdgesChange ] = useEdgesState([]);
    const { project } = useReactFlow();

    const addNewNode = () =>
    {
        const id = (nodes.length + 1).toString();
        const newNode = {
            id,
            type: 'custom',
            position: { x: Math.random() * 250, y: Math.random() * 250 },
            data: {
                label: `Node ${id}`,
                color: '#00BFFF',
                width: 150,
                height: 150,
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
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges])

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
        <div style={{ width: '100vw', height: '90vh' }}>
            <div className="flex space-x-2 p-2">
            <button onClick={addNewNode} className="p-2 bg-green-600 text-white rounded">
                ➕ Add Node
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
                fitView
                nodeTypes={nodeTypes}
            >
                <MiniMap />
                <Controls />
                <Background />
            </ReactFlow>
            </div>
        </div>
    )

}

