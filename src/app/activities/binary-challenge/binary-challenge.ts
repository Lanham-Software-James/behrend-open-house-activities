import { Component, computed, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

export const ROUND_RANGES = [[1, 15], [16, 63], [64, 255]] as const;

export function generateTargets(random: () => number = Math.random): number[] {
  return ROUND_RANGES.map(([min, max]) => min + Math.floor(random() * (max - min + 1)));
}

@Component({
  selector: 'app-binary-challenge',
  imports: [RouterLink],
  templateUrl: './binary-challenge.html',
  styleUrl: './binary-challenge.css',
})
export class BinaryChallenge implements OnDestroy {
  readonly weights = [128, 64, 32, 16, 8, 4, 2, 1];
  readonly targets = signal(generateTargets());
  readonly round = signal(0);
  readonly value = signal(0);
  readonly started = signal(false);
  readonly solved = signal(false);
  readonly finished = signal(false);
  readonly elapsed = signal(0);
  readonly target = computed(() => this.targets()[this.round()]);
  readonly time = computed(() => `${Math.floor(this.elapsed() / 60)}:${String(this.elapsed() % 60).padStart(2, '0')}`);
  readonly equation = computed(() => this.weights.filter((weight) => this.isOn(weight)).join(' + ') || '0');
  private timer?: ReturnType<typeof setInterval>;
  private startedAt = 0;

  isOn(weight: number): boolean { return (this.value() & weight) !== 0; }

  start(): void {
    if (this.started()) return;
    this.started.set(true);
    this.startedAt = Date.now();
    this.timer = setInterval(() => this.updateTime(), 250);
  }

  toggle(weight: number): void {
    if (!this.started() || this.solved() || this.finished() || !this.weights.includes(weight)) return;
    this.value.update((value) => value ^ weight);
    if (this.value() === this.target()) {
      this.solved.set(true);
      if (this.round() === 2) {
        this.updateTime();
        this.stopTimer();
        this.finished.set(true);
      }
    }
  }

  nextRound(): void {
    if (!this.solved() || this.finished()) return;
    this.round.update((round) => round + 1);
    this.value.set(0);
    this.solved.set(false);
  }

  reset(): void {
    this.stopTimer();
    this.targets.set(generateTargets());
    this.round.set(0);
    this.value.set(0);
    this.started.set(false);
    this.solved.set(false);
    this.finished.set(false);
    this.elapsed.set(0);
  }

  private updateTime(): void {
    this.elapsed.set(Math.floor((Date.now() - this.startedAt) / 1000));
  }

  private stopTimer(): void { clearInterval(this.timer); this.timer = undefined; }
  ngOnDestroy(): void { this.stopTimer(); }
}
