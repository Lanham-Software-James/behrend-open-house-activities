import { TestBed } from '@angular/core/testing';
import { binarySearchSteps, SearchReplay } from './search-replay';

describe('Binary search replay', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  it('finds every target within seven midpoint guesses with correctly narrowing ranges', () => {
    for (let target = 1; target <= 100; target++) {
      const steps = binarySearchSteps(target);
      expect(steps.length).toBeLessThanOrEqual(7);
      expect(steps[0].low).toBe(1); expect(steps[0].high).toBe(100);
      expect(steps.at(-1)?.midpoint).toBe(target); expect(steps.at(-1)?.hint).toBe('Found');
      steps.forEach((step, index) => {
        expect(step.midpoint).toBe(Math.floor((step.low + step.high) / 2));
        expect(target).toBeGreaterThanOrEqual(step.low); expect(target).toBeLessThanOrEqual(step.high);
        if (index > 0) {
          const previous = steps[index - 1];
          expect(step.low).toBe(previous.hint === 'Higher' ? previous.midpoint + 1 : previous.low);
          expect(step.high).toBe(previous.hint === 'Lower' ? previous.midpoint - 1 : previous.high);
        }
      });
    }
  });
  it('auto-plays, pauses, steps, finishes and restarts without leaking timers', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    await TestBed.configureTestingModule({ imports: [SearchReplay] }).compileComponents();
    const fixture = TestBed.createComponent(SearchReplay);
    fixture.componentRef.setInput('target', 86); fixture.detectChanges();
    const replay = fixture.componentInstance;
    expect(replay.playing()).toBe(true);
    vi.advanceTimersByTime(1100); expect(replay.index()).toBe(1);
    replay.pause(); vi.advanceTimersByTime(2200); expect(replay.index()).toBe(1);
    replay.next(); expect(replay.index()).toBe(2);
    replay.play(); vi.advanceTimersByTime(10000);
    expect(replay.complete()).toBe(true); expect(replay.step().midpoint).toBe(86);
    expect(vi.getTimerCount()).toBe(0);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Found 86');
    replay.play(); expect(replay.index()).toBe(0);
    fixture.destroy(); expect(vi.getTimerCount()).toBe(0);
  });
  it('lets reduced-motion visitors advance manually', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    await TestBed.configureTestingModule({ imports: [SearchReplay] }).compileComponents();
    const fixture = TestBed.createComponent(SearchReplay);
    fixture.componentRef.setInput('target', 1); fixture.detectChanges();
    expect(fixture.componentInstance.playing()).toBe(false);
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find((button) => button.textContent === 'Next step')!.click(); fixture.detectChanges();
    expect(fixture.componentInstance.index()).toBe(1);
    fixture.destroy();
  });
  it('finishes immediately when the initial midpoint is correct', async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [SearchReplay] }).compileComponents();
    const fixture = TestBed.createComponent(SearchReplay);
    fixture.componentRef.setInput('target', 50); fixture.detectChanges();
    expect(fixture.componentInstance.complete()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Found 50 in 1 guess!');
    expect(vi.getTimerCount()).toBe(0); fixture.destroy();
  });
});
