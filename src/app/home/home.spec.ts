import { Component, input } from '@angular/core';
import { ActivityPreview } from './activity';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { App } from '../app';
import { routes } from '../app.routes';
import { Home } from './home';
import { SearchPreview } from './previews/search-preview';

@Component({
  selector: 'app-test-preview',
  template: '<span class="custom-preview">Custom: {{ preview().label }}</span>',
})
class TestPreview {
  readonly preview = input.required<ActivityPreview>();
}

const activities = [
  ['Beat Binary Search', '/activities/beat-binary-search'],
  ['Find the Shortest Path', '/activities/shortest-path'],
  ['Binary Challenge', '/activities/binary-challenge'],
] as const;

const homeTitle = 'Open House Challenges | Penn State Behrend';

describe('Homepage', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App], providers: [provideRouter(routes)],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
    root = fixture.nativeElement;
    await router.navigateByUrl('/');
    await fixture.whenStable();
  });

  function element<T extends Element = HTMLElement>(selector: string): T {
    const match = root.querySelector<T>(selector);
    expect(match, `Expected ${selector} to exist`).not.toBeNull();
    return match!;
  }

  function card(title: string): HTMLAnchorElement {
    const match = Array.from(root.querySelectorAll<HTMLAnchorElement>('main a'))
      .find((link) => link.querySelector('h3')?.textContent === title);
    expect(match, `Expected a card for ${title}`).toBeDefined();
    return match!;
  }

  it('renders a single welcoming page heading and sets the browser title', () => {
    expect(root.querySelectorAll('h1')).toHaveLength(1);
    expect(element('h1').textContent).toContain('Think you can beat');
    expect(element('h1').textContent).toContain('computer?');
    expect(TestBed.inject(Title).getTitle()).toBe(homeTitle);
  });

  it('offers exactly the three distinct activity destinations', () => {
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('main a'));
    expect(links).toHaveLength(3);
    expect(links.map((link) => link.getAttribute('href')).sort())
      .toEqual(activities.map(([, path]) => path).sort());
  });

  it('preserves the displayed card order', () => {
    expect(Array.from(root.querySelectorAll('main .activity h3'), (heading) => heading.textContent))
      .toEqual(['Find the Shortest Path', 'Beat Binary Search', 'Binary Challenge']);
  });

  it.each([
    ['Find the Shortest Path', 'light'],
    ['Beat Binary Search', 'dark'],
    ['Binary Challenge', 'light'],
  ])('assigns the %s card its %s theme', (title, theme) => {
    const link = card(title);
    expect(link.classList.contains(`theme-${theme}`)).toBe(true);
    expect(link.classList.contains(`theme-${theme === 'light' ? 'dark' : 'light'}`)).toBe(false);
  });

  it('labels the introduction and challenge sections with their headings', () => {
    const sections = root.querySelectorAll('main section');
    expect(sections).toHaveLength(2);
    for (const section of sections) {
      const headingId = section.getAttribute('aria-labelledby');
      expect(headingId).toBeTruthy();
      const heading = element(`[id="${headingId}"]`);
      expect(section.contains(heading)).toBe(true);
      expect(heading.matches('h1, h2')).toBe(true);
      expect(heading.textContent?.trim()).not.toBe('');
    }
  });

  it('avoids duplicate IDs that would make accessible labels ambiguous', () => {
    const ids = Array.from(root.querySelectorAll('[id]'), (node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(activities)('gives the %s card a working label, description, and native link', (title, destination) => {
    const link = card(title);
    expect(link.getAttribute('href')).toBe(destination);
    expect(link.tabIndex).toBe(0);
    const labelId = link.getAttribute('aria-labelledby');
    const descriptionId = link.getAttribute('aria-describedby');
    expect(labelId).toBeTruthy();
    expect(descriptionId).toBeTruthy();
    const label = element(`[id="${labelId}"]`);
    const description = element(`[id="${descriptionId}"]`);
    expect(label.textContent).toBe(title);
    expect(link.contains(label)).toBe(true);
    expect(link.contains(description)).toBe(true);
    expect(description.textContent?.trim().length).toBeGreaterThan(0);
    expect(link.querySelectorAll('a, button, input, select, textarea, [tabindex]')).toHaveLength(0);
  });

  it('keeps illustrative previews out of the accessibility tree', () => {
    const previews = root.querySelectorAll('main .preview');
    expect(previews).toHaveLength(3);
    for (const preview of previews) {
      expect(preview.getAttribute('aria-hidden')).toBe('true');
      expect(preview.querySelectorAll('a, button, input, [tabindex]')).toHaveLength(0);
    }
  });

  it('explains that the activities are previews and require no coding experience', () => {
    expect(element('main').textContent).toContain('No coding experience needed.');
    expect(element('.availability').textContent).toContain('Explore each activity’s preview');
  });

  it('shows a mathematically correct eight-bit example for 86', () => {
    const bits = Array.from(root.querySelectorAll('.bits > span'));
    const weights = bits.map((bit) => Number(bit.querySelector('small')?.textContent));
    const values = bits.map((bit) => Number(Array.from(bit.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent).join('').trim()));
    expect(weights).toEqual([128, 64, 32, 16, 8, 4, 2, 1]);
    expect(values.every((value) => value === 0 || value === 1)).toBe(true);
    expect(values.reduce((total, value, index) => total + value * weights[index], 0)).toBe(86);
    expect(element('.binary-total').textContent).toContain('86');
  });

  it.each(activities)('opens the %s placeholder from its card', async (title, destination) => {
    card(title).click();
    await fixture.whenStable();
    expect(router.url).toBe(destination);
    expect(element('main h1').textContent).toBe(title);
    expect(element('main').textContent).toContain('Activity coming soon.');
    expect(root.querySelector('.activities')).toBeNull();
    expect(TestBed.inject(Title).getTitle()).toBe(`${title} | Penn State Behrend`);
  });

  it.each(activities)('returns home from %s using the shared header', async (_title, destination) => {
    const header = element('header');
    const footer = element('footer');
    await router.navigateByUrl(destination);
    await fixture.whenStable();
    element<HTMLAnchorElement>('header a[aria-label="Open House home"]').click();
    await fixture.whenStable();
    expect(router.url).toBe('/');
    expect(root.querySelectorAll('main .activity')).toHaveLength(3);
    expect(element('main h1').textContent).toContain('Think you can beat');
    expect(TestBed.inject(Title).getTitle()).toBe(homeTitle);
    expect(element('header')).toBe(header);
    expect(element('footer')).toBe(footer);
  });
});

// Exercise the real template with alternate data without changing the production
// component's protected, readonly configuration API.
describe('Homepage activity data rendering', () => {
  let fixture: ComponentFixture<Home>;
  let initial: Home['activities'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home], providers: [provideRouter(routes)],
    }).compileComponents();
    fixture = TestBed.createComponent(Home);
    initial = fixture.componentInstance['activities'];
    await fixture.whenStable();
  });

  async function render(activities: Home['activities']) {
    fixture.destroy();
    fixture = TestBed.createComponent(Home);
    Object.defineProperty(fixture.componentInstance, 'activities', { value: activities });
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function cards(): HTMLAnchorElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('a.activity'));
  }

  it('updates an existing card’s content, route, and theme from its data', async () => {
    await render([
      {
        ...initial[0], title: 'Updated challenge', description: 'A new description.',
        route: '/activities/binary-challenge', theme: 'dark',
        category: 'New category', concept: 'A new concept.', actionLabel: 'Try this activity',
        previewComponent: SearchPreview,
        preview: { kind: 'search', label: 'NEW PREVIEW', min: 10, max: 20, guess: 15, caption: 'Take a guess' },
      },
      ...initial.slice(1),
    ]);
    const updated = cards()[0];
    expect(updated.querySelector('h3')?.textContent).toBe('Updated challenge');
    expect(updated.querySelector(`#${updated.getAttribute('aria-describedby')}`)?.textContent).toBe('A new description.');
    expect(updated.getAttribute('href')).toBe('/activities/binary-challenge');
    expect(updated.classList.contains('theme-dark')).toBe(true);
    expect(updated.classList.contains('theme-light')).toBe(false);
    expect(updated.querySelector('.category')?.textContent).toBe('New category');
    expect(updated.querySelector('.concept')?.textContent).toBe('A new concept.');
    expect(updated.querySelector('.card-action')?.textContent).toContain('Try this activity');
    expect(updated.querySelector('.preview-label')?.textContent).toBe('NEW PREVIEW');
    expect(updated.querySelector('.guess')?.textContent).toBe('15?');
    expect(updated.querySelector('.preview-caption')?.textContent).toBe('Take a guess');
    expect(updated.querySelector('svg')).toBeNull();
    updated.click();
    await fixture.whenStable();
    expect(TestBed.inject(Router).url).toBe('/activities/binary-challenge');
  });

  it('renders a new component selected by the array without a template branch', async () => {
    await render([{ ...initial[0], previewComponent: TestPreview }]);
    const card = cards()[0];
    expect(card.querySelector('.custom-preview')?.textContent).toBe(`Custom: ${initial[0].preview.label}`);
    expect(card.querySelector('app-graph-preview')).toBeNull();
    expect(card.querySelector('.custom-preview')?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('passes independent input data to two instances of the same preview component', async () => {
    await render([
      { ...initial[1], id: 'first-search', preview: {
        kind: 'search', label: 'FIRST', min: 1, max: 10, guess: 5, caption: 'First hint',
      } },
      { ...initial[1], id: 'second-search', preview: {
        kind: 'search', label: 'SECOND', min: 20, max: 40, guess: 30, caption: 'Second hint',
      } },
    ]);
    const [first, second] = cards();
    expect(first.querySelector('.guess')?.textContent).toBe('5?');
    expect(second.querySelector('.guess')?.textContent).toBe('30?');
    expect(first.querySelector('.preview-caption')?.textContent).toBe('First hint');
    expect(second.querySelector('.preview-caption')?.textContent).toBe('Second hint');
    expect(Array.from(second.querySelectorAll('.number-range > span'), (span) => span.textContent))
      .toEqual(['20', '', '40']);
  });

  it('passes configured start and finish labels to the graph preview', async () => {
    await render([{ ...initial[0], preview: {
      kind: 'graph', label: 'CUSTOM ROUTE', start: 'CAMPUS', finish: 'LIBRARY',
    } }]);
    expect(Array.from(cards()[0].querySelectorAll('.graph-labels span'), (span) => span.textContent))
      .toEqual(['CAMPUS', 'LIBRARY']);
    expect(cards()[0].querySelector('svg')).not.toBeNull();
  });

  it('passes alternate bits, active states, and caption to the binary preview', async () => {
    await render([{ ...initial[2], preview: {
      kind: 'binary', label: 'CUSTOM BITS', bits: [
        { weight: 4, value: 1 }, { weight: 2, value: 0 }, { weight: 1, value: 1 },
      ], total: 5, caption: 'Build the number',
    } }]);
    const bits = Array.from(cards()[0].querySelectorAll('.bits > span'));
    expect(bits).toHaveLength(3);
    expect(bits.map((bit) => bit.querySelector('small')?.textContent)).toEqual(['4', '2', '1']);
    expect(bits.map((bit) => bit.classList.contains('on'))).toEqual([true, false, true]);
    expect(cards()[0].querySelector('.binary-total')?.textContent).toBe('Build the number 5.');
  });

  it('renders cards in the order supplied by the array', async () => {
    await render([initial[2], initial[0], initial[1]]);
    expect(cards().map((card) => card.querySelector('h3')?.textContent))
      .toEqual([initial[2].title, initial[0].title, initial[1].title]);
  });

  it('renders an added activity with its own route and accessible references', async () => {
    await render([...initial, {
      ...initial[0], id: 'extra', title: 'Extra challenge', route: '/activities/extra',
    }]);
    expect(cards()).toHaveLength(4);
    const added = cards()[3];
    expect(added.getAttribute('href')).toBe('/activities/extra');
    expect(added.getAttribute('aria-labelledby')).toBe('extra-title');
    expect(added.querySelector('#extra-title')?.textContent).toBe('Extra challenge');
    expect(added.getAttribute('aria-describedby')).toBe('extra-description');
    expect(added.querySelector('#extra-description')?.textContent).toBe(initial[0].description);
    const ids = Array.from(fixture.nativeElement.querySelectorAll('[id]'), (node) => (node as Element).id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('removes a deleted activity without leaving its link or accessible labels behind', async () => {
    await render([initial[0], initial[2]]);
    expect(cards()).toHaveLength(2);
    expect(cards().map((card) => card.getAttribute('href'))).toEqual([initial[0].route, initial[2].route]);
    expect(fixture.nativeElement.querySelector(`#${initial[1].id}-title`)).toBeNull();
    expect(fixture.nativeElement.querySelector(`#${initial[1].id}-description`)).toBeNull();
  });
});
