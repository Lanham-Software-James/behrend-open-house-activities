import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { App } from '../app';
import { routes } from '../app.routes';

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
