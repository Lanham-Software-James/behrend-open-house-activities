import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { binarySearchSteps, SearchReplay } from './search-replay/search-replay';

export function generateSearchTarget(random: () => number = Math.random): number {
  return 1 + Math.floor(random() * 100);
}

type Guess = { value: number; hint: 'Higher' | 'Lower' | 'Correct' };

@Component({
  selector: 'app-beat-binary-search',
  imports: [RouterLink, SearchReplay],
  templateUrl: './beat-binary-search.html',
  styleUrl: './beat-binary-search.css',
})
export class BeatBinarySearch {
  private target = generateSearchTarget();
  readonly history = signal<Guess[]>([]);
  readonly input = signal('');
  readonly error = signal('');
  readonly solved = signal(false);
  readonly count = computed(() => this.history().length);
  readonly feedback = computed(() => {
    const last = this.history().at(-1);
    if (!last) return 'Your first guess could be the one. Pick a number from 1 to 100.';
    if (last.hint === 'Correct') return `You found it! The number was ${last.value}.`;
    return last.hint === 'Higher' ? `Higher! The number is greater than ${last.value}.` : `Lower! The number is less than ${last.value}.`;
  });
  readonly algorithmCount = computed(() => this.solved() ? binarySearchSteps(this.history().at(-1)!.value).length : 0);
  readonly result = computed(() => this.count() < this.algorithmCount() ? 'You beat binary search!' : this.count() === this.algorithmCount() ? 'You matched binary search!' : 'You found it. Now try a smarter search!');

  submit(event?: Event): void {
    event?.preventDefault();
    if (this.solved()) return;
    const raw = this.input().trim();
    const value = Number(raw);
    if (!raw || !Number.isInteger(value) || value < 1 || value > 100) {
      this.error.set('Enter a whole number from 1 to 100.');
      return;
    }
    if (this.history().some((guess) => guess.value === value)) {
      this.error.set('You already tried that number. Try a different one.');
      return;
    }
    this.error.set('');
    const hint = value === this.target ? 'Correct' : value < this.target ? 'Higher' : 'Lower';
    this.history.update((history) => [...history, { value, hint }]);
    this.input.set('');
    if (hint === 'Correct') this.solved.set(true);
  }

  reset(): void {
    this.target = generateSearchTarget();
    this.history.set([]);
    this.input.set('');
    this.error.set('');
    this.solved.set(false);
  }
}
