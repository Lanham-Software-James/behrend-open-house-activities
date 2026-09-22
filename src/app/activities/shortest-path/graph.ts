export interface MapNode { id: number; label: string; x: number; y: number; }
export interface Edge { from: number; to: number; weight: number; }
export interface Graph { nodes: MapNode[]; edges: Edge[]; }
export interface SearchStep { node: number; settled: number[]; distances: number[]; }

// Fixed positions keep the random map readable. Edges and costs change each game.
export function generateGraph(random: () => number = Math.random): Graph {
  const nodes = [
    { id: 0, label: 'START', x: 55, y: 180 },
    { id: 1, label: 'A', x: 190, y: 70 },
    { id: 2, label: 'B', x: 190, y: 290 },
    { id: 3, label: 'C', x: 330, y: 180 },
    { id: 4, label: 'D', x: 470, y: 70 },
    { id: 5, label: 'E', x: 470, y: 290 },
    { id: 6, label: 'FINISH', x: 605, y: 180 },
  ];
  const candidates = [[0,1],[0,2],[1,3],[2,3],[3,4],[3,5],[4,6],[5,6],[1,4],[2,5],[1,2],[4,5]];
  // Random spanning tree guarantees every node is reachable.
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const parents = nodes.map((node) => node.id);
  const root = (n: number): number => parents[n] === n ? n : root(parents[n]);
  const chosen: number[][] = [];
  const extras: number[][] = [];
  for (const pair of shuffled) {
    const [a, b] = pair;
    if (root(a) !== root(b)) { parents[root(a)] = root(b); chosen.push(pair); }
    else extras.push(pair);
  }
  chosen.push(...extras.slice(0, 3));
  return { nodes, edges: chosen.map(([from, to]) => ({ from, to, weight: 1 + Math.floor(random() * 9) })) };
}

export function dijkstra(graph: Graph): { path: number[]; cost: number; steps: SearchStep[] } {
  const distances = graph.nodes.map(() => Infinity);
  const previous = graph.nodes.map(() => -1);
  const settled: number[] = [];
  const steps: SearchStep[] = [];
  distances[0] = 0;
  while (settled.length < graph.nodes.length) {
    let current = -1;
    for (const node of graph.nodes) {
      if (!settled.includes(node.id) && (current === -1 || distances[node.id] < distances[current])) current = node.id;
    }
    if (current === -1 || !Number.isFinite(distances[current])) break;
    settled.push(current);
    for (const edge of graph.edges) {
      const neighbor = edge.from === current ? edge.to : edge.to === current ? edge.from : -1;
      if (neighbor < 0 || settled.includes(neighbor)) continue;
      const candidate = distances[current] + edge.weight;
      if (candidate < distances[neighbor]) { distances[neighbor] = candidate; previous[neighbor] = current; }
    }
    steps.push({ node: current, settled: [...settled], distances: [...distances] });
    if (current === graph.nodes.length - 1) break;
  }
  const path: number[] = [];
  if (Number.isFinite(distances.at(-1)!)) {
    for (let node = graph.nodes.length - 1; node !== -1; node = previous[node]) path.unshift(node);
  }
  return { path, cost: distances.at(-1)!, steps };
}
