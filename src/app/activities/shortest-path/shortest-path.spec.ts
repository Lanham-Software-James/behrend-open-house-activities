import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShortestPath } from './shortest-path';

describe('Interactive route map', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  it('supports clicking and keyboard selection on graph nodes and overlays algorithm costs', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    await TestBed.configureTestingModule({ imports: [ShortestPath], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(ShortestPath);
    await fixture.whenStable();
    const game = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.nodes')).toBeNull();
    const nodes = Array.from(root.querySelectorAll<SVGGElement>('svg [role="button"]'));
    expect(nodes).toHaveLength(7);
    nodes[6].dispatchEvent(new MouseEvent('click'));
    expect(game.route()).toEqual([0]);
    for (const [index, id] of game.solution().path.slice(1).entries()) {
      expect(nodes[id].getAttribute('tabindex')).toBe('0');
      expect(nodes[id].getAttribute('aria-label')).toContain('edge cost');
      nodes[id].dispatchEvent(index === 0 ? new MouseEvent('click') : new KeyboardEvent('keydown', { key: index % 2 ? 'Enter' : ' ', bubbles: true, cancelable: true }));
      await fixture.whenStable();
    }
    expect(game.finished()).toBe(true);
    root.querySelector<HTMLButtonElement>('.actions .primary')!.click(); await fixture.whenStable();
    expect(root.querySelectorAll('.distance-badge')).toHaveLength(7);
    expect(root.querySelectorAll('line.optimal').length).toBe(game.solution().path.length - 1);
    expect(root.querySelector('.map-status')?.textContent).toContain('Shortest route found');
    expect(nodes[6].getAttribute('aria-label')).toContain(`cost from START ${game.solution().cost}`);
    game.reset(); await fixture.whenStable();
    expect(root.querySelector('.distance-badge')).toBeNull();
    expect(root.querySelector('line.optimal')).toBeNull();
    fixture.destroy();
  });
  it('moves the current-node and edge highlights while keeping costs and checked states in sync', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    await TestBed.configureTestingModule({ imports: [ShortestPath], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(ShortestPath);
    const game = fixture.componentInstance;
    for (const id of game.solution().path.slice(1)) game.choose(id);
    fixture.detectChanges();
    game.run(); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const nodes = Array.from(root.querySelectorAll<SVGGElement>('.graph-node'));
    const edges = Array.from(root.querySelectorAll('line'));
    for (let i = 0; i < game.solution().steps.length; i++) {
      const step = game.solution().steps[i];
      expect(root.querySelectorAll('.graph-node.current')).toHaveLength(1);
      expect(nodes[step.node].classList.contains('current')).toBe(true);
      expect(root.querySelectorAll('circle.settled')).toHaveLength(step.settled.length);
      expect(Array.from(root.querySelectorAll('.distance-badge text'), (node) => node.textContent))
        .toEqual(step.distances.map((cost) => `Cost ${game.formatDistance(cost)}`));
      edges.forEach((line, index) => {
        const edge = game.graph().edges[index];
        expect(line.classList.contains('exploring')).toBe(edge.from === step.node || edge.to === step.node);
      });
      expect(root.querySelector('line.optimal')).toBeNull();
      vi.advanceTimersByTime(850); fixture.detectChanges();
    }
    expect(root.querySelector('.graph-node.current')).toBeNull();
    expect(root.querySelector('line.exploring')).toBeNull();
    expect(root.querySelectorAll('line.optimal')).toHaveLength(game.solution().path.length - 1);
    expect(vi.getTimerCount()).toBe(0);
    fixture.destroy();
  });

  it('prevents unavailable nodes from responding to click, Enter, or Space and prevents Space scrolling', async () => {
    await TestBed.configureTestingModule({ imports: [ShortestPath], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(ShortestPath);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const nodes = Array.from(root.querySelectorAll<SVGGElement>('.graph-node'));
    const finish = nodes[6];
    expect(finish.getAttribute('aria-disabled')).toBe('true');
    expect(finish.getAttribute('tabindex')).toBe('-1');
    finish.dispatchEvent(new MouseEvent('click'));
    finish.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    const space = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    finish.dispatchEvent(space);
    expect(space.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.route()).toEqual([0]);
    const next = fixture.componentInstance.solution().path[1];
    nodes[next].dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.route()).toEqual([0, next]);
    expect(nodes[next].getAttribute('aria-disabled')).toBe('true');
    nodes[next].dispatchEvent(new MouseEvent('click'));
    expect(fixture.componentInstance.route()).toEqual([0, next]);
    fixture.destroy();
  });

  it.each(['Try same map', 'New random map'])('clears a running overlay through %s and prevents stale timer updates', async (label) => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    await TestBed.configureTestingModule({ imports: [ShortestPath], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(ShortestPath);
    const game = fixture.componentInstance;
    const oldGraph = game.graph();
    for (const id of game.solution().path.slice(1)) game.choose(id);
    game.run(); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const route = [...game.route()];
    for (const node of root.querySelectorAll('.graph-node')) {
      expect(node.getAttribute('aria-disabled')).toBe('true');
      node.dispatchEvent(new MouseEvent('click'));
    }
    expect(game.route()).toEqual(route);
    const reset = Array.from(root.querySelectorAll<HTMLButtonElement>('.actions button')).find((button) => button.textContent === label)!;
    reset.click(); fixture.detectChanges();
    vi.advanceTimersByTime(10000); fixture.detectChanges();
    expect(game.route()).toEqual([0]); expect(game.cost()).toBe(0);
    expect(root.querySelector('.distance-badge')).toBeNull();
    expect(root.querySelector('.map-status')).toBeNull();
    expect(root.querySelector('line.exploring, line.optimal, .graph-node.current')).toBeNull();
    expect(root.querySelector('.graph-node[tabindex="0"]')).not.toBeNull();
    expect(game.revealed()).toBe(false); expect(vi.getTimerCount()).toBe(0);
    if (label === 'Try same map') expect(game.graph()).toBe(oldGraph);
    else expect(game.graph()).not.toBe(oldGraph);
    fixture.destroy();
  });

});
