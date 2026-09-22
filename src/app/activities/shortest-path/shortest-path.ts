import { Component, computed, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { dijkstra, Edge, generateGraph } from './graph';

@Component({
  selector: 'app-shortest-path', imports: [RouterLink],
  templateUrl: './shortest-path.html', styleUrl: './shortest-path.css',
})
export class ShortestPath implements OnDestroy {
  readonly graph = signal(generateGraph());
  readonly route = signal([0]);
  readonly running = signal(false);
  readonly revealed = signal(false);
  readonly stepIndex = signal(-1);
  readonly solution = computed(() => dijkstra(this.graph()));
  readonly currentStep = computed(() => this.solution().steps[this.stepIndex()]);
  readonly finished = computed(() => this.route().at(-1) === 6);
  readonly cost = computed(() => this.route().slice(1).reduce((total, node, i) => total + this.graph().edges.find((edge) => this.connects(edge, this.route()[i], node))!.weight, 0));
  readonly message = computed(() => this.revealed() ? (this.cost() === this.solution().cost ? 'You found a shortest route!' : 'A shorter route was hiding in the graph.') : this.running() ? 'Dijkstra is checking the cheapest reachable node next.' : this.finished() ? 'Route complete. Ready to compare?' : `Choose a connected node from ${this.graph().nodes[this.route().at(-1)!].label}.`);
  private timer?: ReturnType<typeof setInterval>;
  connects(edge: Edge, a: number, b: number): boolean { return edge.from === a && edge.to === b || edge.from === b && edge.to === a; }
  onPath(edge: Edge, path: number[]): boolean { return path.slice(1).some((node, i) => this.connects(edge, path[i], node)); }
  available(id: number): boolean { return !this.finished() && !this.running() && !this.revealed() && !this.route().includes(id) && this.graph().edges.some((edge) => this.connects(edge, this.route().at(-1)!, id)); }
  nodeLabel(id: number): string {
    const node = this.graph().nodes[id];
    const step = this.currentStep();
    if (step) return `${node.label}, cost from START ${this.formatDistance(step.distances[id])}, ${step.settled.includes(id) ? 'checked' : 'pending'}`;
    const edge = this.graph().edges.find((edge) => this.connects(edge, this.route().at(-1)!, id));
    return `${node.label}${this.available(id) ? ', edge cost ' + edge!.weight : ', unavailable'}`;
  }
  choose(id: number): void { if (this.available(id)) this.route.update((route) => [...route, id]); }
  undo(): void { if (!this.running() && !this.revealed() && this.route().length > 1) this.route.update((route) => route.slice(0, -1)); }
  run(): void {
    if (!this.finished() || this.running() || this.revealed()) return;
    this.stepIndex.set(0);
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { this.revealed.set(true); this.stepIndex.set(this.solution().steps.length - 1); return; }
    this.running.set(true);
    this.timer = setInterval(() => {
      if (this.stepIndex() + 1 < this.solution().steps.length) this.stepIndex.update((index) => index + 1);
      else { this.stop(); this.revealed.set(true); }
    }, 850);
  }
  reset(newMap = false): void {
    this.stop(); if (newMap) this.graph.set(generateGraph());
    this.route.set([0]); this.stepIndex.set(-1); this.revealed.set(false);
  }
  formatDistance(value: number): string { return Number.isFinite(value) ? String(value) : '—'; }
  private stop(): void { clearInterval(this.timer); this.running.set(false); }
  ngOnDestroy(): void { this.stop(); }
}
