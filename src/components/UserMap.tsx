import React from "react";
import ReactFlow, { Background, Controls, Edge, Node } from "reactflow";
import "reactflow/dist/style.css";

interface UserMapProps {
  nodes: Node[];
  edges: Edge[];
}

export default function UserMap({ nodes, edges }: UserMapProps) {
  return (
    <div style={{ width: "100%", height: "70vh", border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnDoubleClick={false}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
