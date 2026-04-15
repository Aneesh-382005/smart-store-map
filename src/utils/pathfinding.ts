import { Edge } from "reactflow";

type NodeDistance = {
  id: string;
  distance: number;
};

export function findShortestPath(
  nodeIds: string[],
  edges: Pick<Edge, "source" | "target" | "data">[],
  startNodeId: string,
  endNodeId: string
): string[] {
  if (!startNodeId || !endNodeId || startNodeId === endNodeId) {
    return startNodeId && endNodeId && startNodeId === endNodeId ? [startNodeId] : [];
  }

  const nodeSet = new Set(nodeIds);
  if (!nodeSet.has(startNodeId) || !nodeSet.has(endNodeId)) {
    return [];
  }

  const adjacency = new Map<string, Array<{ to: string; weight: number }>>();
  nodeIds.forEach((id) => adjacency.set(id, []));

  edges.forEach((edge) => {
    if (!nodeSet.has(edge.source) || !nodeSet.has(edge.target)) {
      return;
    }

    const rawWeight = (edge.data as { weight?: unknown } | undefined)?.weight;
    const weight = typeof rawWeight === "number" && rawWeight > 0 ? rawWeight : 1;

    adjacency.get(edge.source)?.push({ to: edge.target, weight });
    adjacency.get(edge.target)?.push({ to: edge.source, weight });
  });

  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set(nodeIds);

  nodeIds.forEach((id) => {
    distances.set(id, Number.POSITIVE_INFINITY);
    previous.set(id, null);
  });
  distances.set(startNodeId, 0);

  while (unvisited.size > 0) {
    let current: NodeDistance | null = null;

    for (const id of unvisited) {
      const distance = distances.get(id) ?? Number.POSITIVE_INFINITY;
      if (!current || distance < current.distance) {
        current = { id, distance };
      }
    }

    if (!current || current.distance === Number.POSITIVE_INFINITY) {
      break;
    }

    unvisited.delete(current.id);

    if (current.id === endNodeId) {
      break;
    }

    const currentNode = current;

    (adjacency.get(currentNode.id) || []).forEach(({ to, weight }) => {
      if (!unvisited.has(to)) {
        return;
      }

      const alternative = currentNode.distance + weight;
      if (alternative < (distances.get(to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(to, alternative);
        previous.set(to, currentNode.id);
      }
    });
  }

  const path: string[] = [];
  let current: string | null = endNodeId;

  while (current) {
    path.unshift(current);
    current = previous.get(current) ?? null;
  }

  return path[0] === startNodeId ? path : [];
}
