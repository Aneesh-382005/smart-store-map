import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Edge, Node } from "reactflow";
import { supabase } from "../utils/supabaseClient";
import { findShortestPath } from "../utils/pathfinding";

const UserMap = dynamic(() => import("../components/UserMap"), { ssr: false });

interface StoredMap {
  graph_json: {
    nodes?: Node[];
    edges?: Edge[];
  } | string;
}

function normalizeNodes(rawNodes: Node[]): Node[] {
  return rawNodes.map((node) => {
    const nodeName =
      (node.data as { metadata?: { name?: string }; label?: string } | undefined)?.metadata?.name ||
      (node.data as { label?: string } | undefined)?.label ||
      `Node ${node.id}`;

    return {
      ...node,
      type: undefined,
      data: { label: nodeName },
      style: {
        ...node.style,
        background:
          (node.data as { color?: string } | undefined)?.color ||
          (node.style as { background?: string } | undefined)?.background ||
          "#00BFFF",
        color: "white",
        borderRadius: 6,
        border: "1px solid #1f2937",
      },
      draggable: false,
      selectable: false,
      connectable: false,
    };
  });
}

export default function HomePage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [startNodeId, setStartNodeId] = useState("");
  const [endNodeId, setEndNodeId] = useState("");
  const [pathNodeIds, setPathNodeIds] = useState<string[]>([]);
  const [hasCalculatedPath, setHasCalculatedPath] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadMap() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("maps")
        .select("graph_json")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error(error);
        setErrorMessage("Unable to load map data right now.");
        setLoading(false);
        return;
      }

      const latestMap = (data || [])[0] as StoredMap | undefined;
      if (!latestMap) {
        setNodes([]);
        setEdges([]);
        setLoading(false);
        return;
      }

      let graphData: { nodes?: Node[]; edges?: Edge[] };
      try {
        graphData =
          typeof latestMap.graph_json === "string"
            ? (JSON.parse(latestMap.graph_json) as { nodes?: Node[]; edges?: Edge[] })
            : latestMap.graph_json;
      } catch (parseError) {
        console.error(parseError);
        setErrorMessage("Map data is corrupted and could not be parsed.");
        setNodes([]);
        setEdges([]);
        setLoading(false);
        return;
      }

      setNodes(normalizeNodes(graphData.nodes || []));
      setEdges((graphData.edges || []) as Edge[]);
      setPathNodeIds([]);
      setHasCalculatedPath(false);
      setLoading(false);
    }

    loadMap();
  }, []);

  const highlightedMap = useMemo(() => {
    const pathSet = new Set(pathNodeIds);
    const pathEdgeSet = new Set<string>();

    for (let i = 0; i < pathNodeIds.length - 1; i += 1) {
      const keyA = `${pathNodeIds[i]}->${pathNodeIds[i + 1]}`;
      const keyB = `${pathNodeIds[i + 1]}->${pathNodeIds[i]}`;
      pathEdgeSet.add(keyA);
      pathEdgeSet.add(keyB);
    }

    const highlightedNodes = nodes.map((node) => {
      const isPathNode = pathSet.has(node.id);
      return {
        ...node,
        style: {
          ...node.style,
          boxShadow: isPathNode ? "0 0 0 3px #f59e0b" : "none",
          border: isPathNode ? "2px solid #f59e0b" : "1px solid #1f2937",
        },
      };
    });

    const highlightedEdges = edges.map((edge) => {
      const isPathEdge = pathEdgeSet.has(`${edge.source}->${edge.target}`);
      return {
        ...edge,
        animated: isPathEdge,
        style: {
          ...(edge.style || {}),
          stroke: isPathEdge ? "#f59e0b" : "#64748b",
          strokeWidth: isPathEdge ? 4 : 2,
        },
      };
    });

    return { highlightedNodes, highlightedEdges };
  }, [edges, nodes, pathNodeIds]);

  const calculatePath = () => {
    const path = findShortestPath(
      nodes.map((node) => node.id),
      edges,
      startNodeId,
      endNodeId
    );
    setPathNodeIds(path);
    setHasCalculatedPath(true);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Smart Store Map</h1>

      <div className="mb-6">
        <Link href="/admin" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
          🗺️ Open Map Editor
        </Link>
      </div>

      {loading && <p>Loading map...</p>}
      {!loading && errorMessage && <p className="text-red-600">{errorMessage}</p>}
      {!loading && !errorMessage && nodes.length === 0 && <p>No saved maps found yet.</p>}

      {!loading && !errorMessage && nodes.length > 0 && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <select
              className="border rounded p-2"
              value={startNodeId}
              onChange={(e) => {
                setStartNodeId(e.target.value);
                setHasCalculatedPath(false);
                setPathNodeIds([]);
              }}
            >
              <option value="">Select start node</option>
              {nodes.map((node) => (
                <option key={`start-${node.id}`} value={node.id}>
                  {(node.data as { label?: string }).label || node.id}
                </option>
              ))}
            </select>

            <select
              className="border rounded p-2"
              value={endNodeId}
              onChange={(e) => {
                setEndNodeId(e.target.value);
                setHasCalculatedPath(false);
                setPathNodeIds([]);
              }}
            >
              <option value="">Select end node</option>
              {nodes.map((node) => (
                <option key={`end-${node.id}`} value={node.id}>
                  {(node.data as { label?: string }).label || node.id}
                </option>
              ))}
            </select>

            <button
              onClick={calculatePath}
              disabled={!startNodeId || !endNodeId}
              className="bg-amber-500 text-white rounded px-4 py-2 font-semibold disabled:opacity-50"
            >
              Find Path
            </button>
          </div>

          <UserMap nodes={highlightedMap.highlightedNodes} edges={highlightedMap.highlightedEdges} />

          {hasCalculatedPath && startNodeId && endNodeId && pathNodeIds.length === 0 && (
            <p className="mt-3 text-sm text-red-600">No path found between the selected nodes.</p>
          )}
          {pathNodeIds.length > 0 && (
            <p className="mt-3 text-sm text-green-700">Path: {pathNodeIds.join(" → ")}</p>
          )}
        </>
      )}
    </div>
  );
}
