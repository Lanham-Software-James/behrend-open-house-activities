import { By } from '@angular/platform-browser';
import { SearchReplay } from './search-replay/search-replay';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BeatBinarySearch, generateSearchTarget } from './beat-binary-search';

describe('Beat Binary Search', () => {
  let game: BeatBinarySearch;
  beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(.49); game = new BeatBinarySearch(); });
  afterEach(() => vi.restoreAllMocks());
  function guess(value: string) { game.input.set(value); game.submit(); }

  it('generates bounded random integers including both endpoints', () => {
    expect(generateSearchTarget(() => 0)).toBe(1);
    expect(generateSearchTarget(() => .999999)).toBe(100);
    expect(generateSearchTarget(() => .5)).toBe(51);
  });
  it.each(['', ' ', '0', '101', '-1', '2.5', 'abc', 'Infinity'])('rejects invalid input %j without counting a guess', (value) => {
    guess(value); expect(game.error()).toContain('whole number'); expect(game.count()).toBe(0);
  });
  it('gives higher and lower hints and preserves chronological history', () => {
    guess('25'); expect(game.feedback()).toContain('Higher!');
    guess('75'); expect(game.feedback()).toContain('Lower!');
    expect(game.history()).toEqual([{ value: 25, hint: 'Higher' }, { value: 75, hint: 'Lower' }]);
    expect(game.input()).toBe('');
  });
  it('rejects duplicate guesses without increasing the count and clears errors after a valid guess', () => {
    guess('25'); guess('25'); expect(game.count()).toBe(1); expect(game.error()).toContain('already tried');
    guess('30'); expect(game.error()).toBe(''); expect(game.count()).toBe(2);
  });
  it.each([[1, 'matched binary search'], [6, 'found it'], [7, 'found it'], [8, 'found it']])('scores a solution in %i guesses', (count, message) => {
    for (let n = 1; n < count; n++) guess(String(n));
    guess('50'); expect(game.solved()).toBe(true); expect(game.count()).toBe(count);
    expect(game.result()).toContain(message);
    guess('90'); expect(game.count()).toBe(count);
  });
  it('compares against actual steps for a target needing more than one guess', () => {
    vi.mocked(Math.random).mockReturnValue(.85); game.reset();
    expect(game.algorithmCount()).toBe(0);
    guess('86');
    expect(game.algorithmCount()).toBe(6);
    expect(game.result()).toBe('You beat binary search!');
    game.reset(); expect(game.algorithmCount()).toBe(0);
  });
  it.each([
    [25, 1, 2, 'You beat binary search!'],
    [25, 2, 2, 'You matched binary search!'],
    [25, 3, 2, 'You found it. Now try a smarter search!'],
    [86, 6, 6, 'You matched binary search!'],
    [100, 7, 7, 'You matched binary search!'],
  ])('scores target %i in %i guesses against its actual %i steps', (target, count, expectedSteps, result) => {
    vi.mocked(Math.random).mockReturnValue((target - 0.5) / 100); game.reset();
    for (let n = 1; n < count; n++) guess(String(n));
    expect(game.algorithmCount()).toBe(0);
    guess(String(target));
    expect(game.algorithmCount()).toBe(expectedSteps);
    expect(game.result()).toBe(result);
  });

  it('recalculates the actual outcome for a new target after replay', () => {
    guess('50'); expect(game.algorithmCount()).toBe(1);
    vi.mocked(Math.random).mockReturnValue(.249); game.reset();
    expect(game.algorithmCount()).toBe(0);
    guess('25'); expect(game.algorithmCount()).toBe(2);
    expect(game.result()).toBe('You beat binary search!');
  });

  it('resets history, errors, input and result and draws a new target', () => {
    guess('50'); game.input.set('80');
    vi.mocked(Math.random).mockReturnValue(.99);
    game.reset();
    expect(game.history()).toEqual([]); expect(game.input()).toBe(''); expect(game.error()).toBe('');
    expect(game.solved()).toBe(false); guess('100'); expect(game.solved()).toBe(true);
  });
});

describe('Binary Search controls', () => {
  afterEach(() => vi.restoreAllMocks());
  it('keeps the displayed comparison consistent with the replay and hides it until solved', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(.85);
    await TestBed.configureTestingModule({ imports: [BeatBinarySearch], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(BeatBinarySearch);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.comparison')).toBeNull();
    expect(root.querySelector('app-search-replay')).toBeNull();
    fixture.componentInstance.input.set('86'); fixture.componentInstance.submit();
    await fixture.whenStable();
    const replay = fixture.debugElement.query(By.directive(SearchReplay)).componentInstance as SearchReplay;
    replay.pause();
    while (!replay.complete()) replay.next();
    await fixture.whenStable();
    expect(replay.target()).toBe(86);
    expect(replay.steps().map((step) => step.midpoint)).toEqual([50, 75, 88, 81, 84, 86]);
    expect(root.querySelector('.comparison p:last-child')?.textContent).toBe('Binary Search6 guesses');
    expect(root.querySelector('app-search-replay')?.textContent).toContain('Found 86 in 6 guesses!');
    expect(root.querySelector('.comparison p:first-child')?.textContent).toBe('You1 guess');
    fixture.destroy();
  });

  it('submits guesses, announces hints, shows results and replays through the UI', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(.49);
    await TestBed.configureTestingModule({ imports: [BeatBinarySearch], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(BeatBinarySearch);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    async function submit(value: string) {
      const input = root.querySelector<HTMLInputElement>('#guess')!;
      input.value = value; input.dispatchEvent(new Event('input'));
      root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
      await fixture.whenStable();
    }
    await submit('');
    expect(root.querySelector('#guess')?.getAttribute('aria-invalid')).toBe('true');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('whole number');
    await submit('25');
    expect(root.querySelector('[aria-live="polite"]')?.textContent).toContain('Higher!');
    expect(root.querySelector('li')?.textContent).toContain('25');
    await submit('50');
    expect(root.querySelector('form')).toBeNull();
    expect(root.querySelector('.result')?.textContent).toContain('You found it. Now try a smarter search!');
    expect(root.querySelector('.comparison')?.textContent).toContain('2 guesses');
    expect(root.querySelector('.comparison p:last-child')?.textContent).toBe('Binary Search1 guess');
    expect(root.textContent).not.toContain('≤7');
    root.querySelector<HTMLButtonElement>('.result > button')!.click(); await fixture.whenStable();
    expect(root.querySelector('#guess')).not.toBeNull();
    expect(root.querySelector('.history')).toBeNull();
    expect(root.querySelector('.count')?.textContent).toContain('0 guesses');
    fixture.destroy();
  });
});
