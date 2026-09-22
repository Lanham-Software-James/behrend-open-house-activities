import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BinaryChallenge, generateTargets } from './binary-challenge';

describe('Binary Challenge', () => {
  let game: BinaryChallenge;
  beforeEach(() => { vi.useFakeTimers(); game = new BinaryChallenge(); game.targets.set([5, 42, 86]); });
  afterEach(() => { game.ngOnDestroy(); vi.useRealTimers(); });
  function solve() { for (const weight of game.weights) if ((game.target() & weight) !== 0) game.toggle(weight); }

  it('generates inclusive bounded targets at both random extremes', () => {
    expect(generateTargets(() => 0)).toEqual([1, 16, 64]);
    expect(generateTargets(() => .999999)).toEqual([15, 63, 255]);
    expect(generateTargets(() => .5)).toEqual([8, 40, 160]);
  });
  it('ignores switches before starting and invalid weights', () => {
    game.toggle(4); expect(game.value()).toBe(0);
    game.start(); game.toggle(3); expect(game.value()).toBe(0);
  });
  it('adds and removes bit values and updates the equation', () => {
    game.start(); game.toggle(64); game.toggle(16);
    expect(game.value()).toBe(80); expect(game.equation()).toBe('64 + 16');
    game.toggle(64); expect(game.value()).toBe(16); expect(game.isOn(64)).toBe(false);
  });
  it('requires an exact match and locks a solved round', () => {
    game.start(); game.toggle(4); expect(game.solved()).toBe(false);
    game.nextRound(); expect(game.round()).toBe(0);
    game.toggle(1); expect(game.solved()).toBe(true);
    game.toggle(128); expect(game.value()).toBe(5);
    game.nextRound(); expect(game.round()).toBe(1); expect(game.value()).toBe(0); expect(game.solved()).toBe(false);
  });
  it('times all three rounds and stops on completion', () => {
    game.start(); game.start(); expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(61000); expect(game.time()).toBe('1:01');
    solve(); game.nextRound(); solve(); game.nextRound();
    vi.advanceTimersByTime(4000); solve();
    expect(game.finished()).toBe(true); expect(game.time()).toBe('1:05');
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(5000); expect(game.time()).toBe('1:05');
    game.nextRound(); expect(game.round()).toBe(2);
  });
  it('resets the entire session with newly generated targets and no running timer', () => {
    game.start(); solve(); game.nextRound(); vi.advanceTimersByTime(3000);
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    game.reset(); random.mockRestore();
    expect(game.targets()).toEqual([1, 16, 64]);
    expect(game.round()).toBe(0); expect(game.value()).toBe(0);
    expect(game.started()).toBe(false); expect(game.solved()).toBe(false);
    expect(game.finished()).toBe(false); expect(game.time()).toBe('0:00');
    expect(vi.getTimerCount()).toBe(0);
  });
  it('supports the full eight-bit range and removing all selected bits', () => {
    game.targets.set([1, 16, 255]);
    game.start(); game.toggle(128); game.toggle(64);
    expect(game.value()).toBe(192);
    game.toggle(128); game.toggle(64);
    expect(game.value()).toBe(0); expect(game.equation()).toBe('0');
    solve(); game.nextRound(); solve(); game.nextRound(); solve();
    expect(game.value()).toBe(255);
    expect(game.weights.every((weight) => game.isOn(weight))).toBe(true);
    expect(game.finished()).toBe(true);
    game.toggle(128); expect(game.value()).toBe(255);
  });

  it('starts a fresh timer after replaying a completed game', () => {
    game.start(); vi.advanceTimersByTime(5000);
    solve(); game.nextRound(); solve(); game.nextRound(); solve();
    game.reset();
    expect(game.finished()).toBe(false);
    vi.advanceTimersByTime(10000); expect(game.elapsed()).toBe(0);
    game.start(); vi.advanceTimersByTime(2000);
    expect(game.time()).toBe('0:02'); expect(vi.getTimerCount()).toBe(1);
  });

  it('keeps timing between rounds without allowing repeated next-round clicks to skip ahead', () => {
    game.start(); solve(); vi.advanceTimersByTime(3000);
    expect(game.elapsed()).toBe(3);
    game.nextRound(); game.nextRound();
    expect(game.round()).toBe(1); expect(game.target()).toBe(42);
    vi.advanceTimersByTime(2000); expect(game.elapsed()).toBe(5);
  });

  it('samples each round independently within its own bounds', () => {
    const random = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(.999999).mockReturnValueOnce(.5);
    expect(generateTargets(random)).toEqual([1, 63, 160]);
    expect(random).toHaveBeenCalledTimes(3);
  });

  it('cleans up the timer when leaving the activity', () => {
    game.start(); game.ngOnDestroy(); expect(vi.getTimerCount()).toBe(0);
  });
});

describe('Binary Challenge controls', () => {
  it('completes all rounds, offers replay, and resets the visible controls', async () => {
    await TestBed.configureTestingModule({ imports: [BinaryChallenge], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(BinaryChallenge);
    fixture.componentInstance.targets.set([5, 42, 86]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    async function clickButton(label: string) {
      const button = Array.from(root.querySelectorAll<HTMLButtonElement>('button'))
        .find((button) => button.textContent?.includes(label));
      expect(button, `Expected button: ${label}`).toBeDefined();
      button!.click(); await fixture.whenStable();
    }
    await clickButton('Start challenge');
    for (const [index, bits] of [[4, 1], [32, 8, 2], [64, 16, 4, 2]].entries()) {
      expect(root.querySelector('.status')?.textContent).toContain(`Round ${index + 1} of 3`);
      for (const weight of bits) {
        root.querySelector<HTMLButtonElement>(`[aria-label="${weight} bit"]`)!.click();
        await fixture.whenStable();
      }
      if (index < 2) {
        await clickButton('Next round');
        expect(root.querySelector('.total strong')?.textContent).toBe('0');
        expect(Array.from(root.querySelectorAll<HTMLButtonElement>('[role="switch"]'))
          .every((button) => !button.disabled && button.getAttribute('aria-checked') === 'false')).toBe(true);
      }
    }
    expect(root.querySelector('.feedback')?.textContent).toContain('Three for three');
    expect(root.querySelector('.feedback')?.textContent).toContain(fixture.componentInstance.time());
    expect(root.textContent).not.toContain('Next round');
    await clickButton('Play again');
    expect(root.querySelector('.status')?.textContent).toContain('Round 1 of 3');
    expect(root.querySelector('[role="timer"]')?.textContent).toBe('0:00');
    expect(root.querySelector('.total strong')?.textContent).toBe('0');
    expect(root.querySelector('.start button')?.textContent).toContain('Start challenge');
    expect(Array.from(root.querySelectorAll<HTMLButtonElement>('[role="switch"]')).every((button) => button.disabled)).toBe(true);
    fixture.destroy();
  });

  it('updates guidance when a guess overshoots and then falls below the target', async () => {
    await TestBed.configureTestingModule({ imports: [BinaryChallenge], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(BinaryChallenge);
    fixture.componentInstance.targets.set([5, 42, 86]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('.start button')!.click(); await fixture.whenStable();
    const eight = root.querySelector<HTMLButtonElement>('[aria-label="8 bit"]')!;
    eight.click(); await fixture.whenStable();
    expect(root.querySelector('.feedback')?.textContent).toContain('too high');
    eight.click(); await fixture.whenStable();
    expect(eight.getAttribute('aria-checked')).toBe('false');
    expect(root.querySelector('.feedback')?.textContent).toContain('below the target');
    fixture.destroy();
  });

  it('renders eight accessible switches and updates their state through clicks', async () => {
    await TestBed.configureTestingModule({ imports: [BinaryChallenge], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(BinaryChallenge);
    fixture.componentInstance.targets.set([5, 42, 86]);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const switches = Array.from(root.querySelectorAll<HTMLButtonElement>('[role="switch"]'));
    expect(switches).toHaveLength(8);
    expect(switches.every((button) => button.disabled)).toBe(true);
    root.querySelector<HTMLButtonElement>('.start button')!.click(); await fixture.whenStable();
    const four = switches.find((button) => button.getAttribute('aria-label') === '4 bit')!;
    four.click(); await fixture.whenStable();
    expect(four.getAttribute('aria-checked')).toBe('true');
    expect(root.querySelector('.total strong')?.textContent).toBe('4');
    switches.find((button) => button.getAttribute('aria-label') === '1 bit')!.click(); await fixture.whenStable();
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('You made 5!');
    expect(switches.every((button) => button.disabled)).toBe(true);
    fixture.destroy();
  });
});
