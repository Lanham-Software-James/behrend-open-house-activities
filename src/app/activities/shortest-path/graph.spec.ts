import { dijkstra, generateGraph, Graph } from './graph';
import { ShortestPath } from './shortest-path';

function seeded(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
// Independent exhaustive search is practical for seven-node test graphs.
function cheapest(graph: Graph, current = 0, visited = [0]): number {
  if (current === 6) return 0;
  let best = Infinity;
  for (const edge of graph.edges) {
    const next = edge.from === current ? edge.to : edge.to === current ? edge.from : -1;
    if (next >= 0 && !visited.includes(next)) best = Math.min(best, edge.weight + cheapest(graph, next, [...visited, next]));
  }
  return best;
}

describe('Random route maps and Dijkstra', () => {
  it('generates valid connected maps and finds the true minimum over 100 seeded maps', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const graph = generateGraph(seeded(seed));
      expect(graph.nodes).toHaveLength(7); expect(graph.edges).toHaveLength(9);
      expect(new Set(graph.edges.map((edge) => `${Math.min(edge.from, edge.to)}-${Math.max(edge.from, edge.to)}`)).size).toBe(9);
      for (const edge of graph.edges) { expect(edge.weight).toBeGreaterThanOrEqual(1); expect(edge.weight).toBeLessThanOrEqual(9); expect(Number.isInteger(edge.weight)).toBe(true); }
      const reached = new Set([0]);
      for (let i = 0; i < 7; i++) for (const edge of graph.edges) {
        if (reached.has(edge.from)) reached.add(edge.to);
        if (reached.has(edge.to)) reached.add(edge.from);
      }
      expect(reached.size).toBe(7);
      const result = dijkstra(graph);
      expect(result.cost).toBe(cheapest(graph));
      expect(result.path[0]).toBe(0); expect(result.path.at(-1)).toBe(6);
      let cost = 0;
      result.path.slice(1).forEach((node, i) => {
        const previous = result.path[i];
        const edge = graph.edges.find((edge) => edge.from === node && edge.to === previous || edge.to === node && edge.from === previous);
        expect(edge).toBeDefined(); cost += edge!.weight;
      });
      expect(cost).toBe(result.cost);
      const costs = result.steps.map((step) => step.distances[step.node]);
      expect(costs).toEqual([...costs].sort((a,b) => a-b));
    }
  });
  it('varies topology and costs between seeds', () => { expect(generateGraph(seeded(1))).not.toEqual(generateGraph(seeded(2))); });
});

describe('Shortest Path game', () => {
  let game: ShortestPath;
  beforeEach(() => { vi.useFakeTimers(); game = new ShortestPath(); game.graph.set(generateGraph(seeded(42))); });
  afterEach(() => { game.ngOnDestroy(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  function finish() { for (const node of game.solution().path.slice(1)) game.choose(node); }
  it('rejects disconnected nodes, revisits and an early algorithm run', () => {
    game.choose(6); game.choose(0); expect(game.route()).toEqual([0]);
    game.run(); expect(game.running()).toBe(false);
  });
  it('totals a valid route, undoes it, and recognizes an optimal solution', () => {
    finish(); expect(game.finished()).toBe(true); expect(game.cost()).toBe(game.solution().cost);
    game.undo(); expect(game.finished()).toBe(false);
    game.choose(6); expect(game.finished()).toBe(true);
  });
  it('animates and locks the route, then reveals the comparison', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    finish(); const route = game.route(); game.run(); game.run();
    expect(vi.getTimerCount()).toBe(1); game.undo(); expect(game.route()).toEqual(route);
    vi.advanceTimersByTime(10000);
    expect(game.revealed()).toBe(true); expect(game.running()).toBe(false);
    expect(game.message()).toBe('You found a shortest route!'); expect(vi.getTimerCount()).toBe(0);
  });
  it('reveals immediately for reduced motion and resets for replay', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    finish(); game.run(); expect(game.revealed()).toBe(true); expect(vi.getTimerCount()).toBe(0);
    const graph = game.graph(); game.reset(); expect(game.graph()).toBe(graph);
    expect(game.route()).toEqual([0]); expect(game.cost()).toBe(0); expect(game.stepIndex()).toBe(-1);
    expect(game.revealed()).toBe(false);
  });
  it('cleans up animation on reset and destruction', () => {
    finish(); game.run(); game.reset(true); expect(vi.getTimerCount()).toBe(0);
    finish(); game.run(); game.ngOnDestroy(); expect(vi.getTimerCount()).toBe(0);
  });
});
