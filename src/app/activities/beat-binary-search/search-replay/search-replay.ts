import { Component, computed, input, OnDestroy, OnInit, signal } from '@angular/core';

export interface SearchStep { low: number; high: number; midpoint: number; hint: 'Higher' | 'Lower' | 'Found'; }
export function binarySearchSteps(target: number): SearchStep[] {
  if (!Number.isInteger(target) || target < 1 || target > 100) return [];
  const steps: SearchStep[] = [];
  let low = 1, high = 100;
  while (low <= high) {
    const midpoint = Math.floor((low + high) / 2);
    const hint = midpoint === target ? 'Found' : midpoint < target ? 'Higher' : 'Lower';
    steps.push({ low, high, midpoint, hint });
    if (hint === 'Found') break;
    if (hint === 'Higher') low = midpoint + 1;
    else high = midpoint - 1;
  }
  return steps;
}

@Component({
  selector: 'app-search-replay',
  templateUrl: './search-replay.html',
  styleUrl: './search-replay.css',
})
export class SearchReplay implements OnInit, OnDestroy {
  readonly target = input.required<number>();
  readonly steps = computed(() => binarySearchSteps(this.target()));
  readonly index = signal(0);
  readonly step = computed(() => this.steps()[this.index()]);
  readonly shown = computed(() => this.steps().slice(0, this.index() + 1));
  readonly complete = computed(() => this.index() === this.steps().length - 1);
  readonly playing = signal(false);
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    // Reduced-motion visitors advance the same explanation at their own pace.
    if (!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) this.play();
  }
  play(): void {
    this.pause();
    if (this.complete()) this.index.set(0);
    if (this.complete()) return;
    this.playing.set(true);
    this.timer = setInterval(() => this.next(), 1100);
  }
  next(): void {
    if (!this.complete()) this.index.update((index) => index + 1);
    if (this.complete()) this.pause();
  }
  pause(): void { clearInterval(this.timer); this.timer = undefined; this.playing.set(false); }
  ngOnDestroy(): void { this.pause(); }
}
