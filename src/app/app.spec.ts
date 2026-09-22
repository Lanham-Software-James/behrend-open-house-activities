import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';

@Component({ template: '<h1>Choose a challenge</h1>' })
class HomePage {}

@Component({ template: '<h1>Binary challenge</h1>' })
class ChallengePage {}

describe('App shell', () => {
  let fixture: ComponentFixture<App>;
  let root: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([
        { path: '', component: HomePage },
        { path: 'challenge', component: ChallengePage },
      ])],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    root = fixture.nativeElement;
    await fixture.whenStable();
  });

  function element<T extends Element = HTMLElement>(selector: string): T {
    const match = root.querySelector<T>(selector);
    expect(match, `Expected ${selector} to exist`).not.toBeNull();
    return match!;
  }

  it('creates the application', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('provides one header, main content landmark, and footer in reading order', () => {
    const landmarks = root.querySelectorAll('header, main, footer');
    expect(Array.from(landmarks, (node) => node.tagName)).toEqual(['HEADER', 'MAIN', 'FOOTER']);
    expect(element('main').getAttribute('aria-label')).toBe('Open House activities');
  });

  it('identifies the Open House and both academic programs in the header', () => {
    const header = element('header');
    expect(header.textContent).toContain('Open House');
    expect(header.textContent).toContain('Computer Science & Software Engineering');
  });

  it('renders the supplied logo with an accessible name inside the campus link', () => {
    const logo = element<HTMLImageElement>('header img');
    expect(logo.getAttribute('src')).toBe('PSU_EBO_RGB_2C.svg');
    expect(logo.alt).toBe('Penn State Behrend');
    const link = logo.closest('a');
    expect(link?.getAttribute('href')).toBe('https://behrend.psu.edu/');
    expect(link?.getAttribute('aria-label')).toBe('Penn State Behrend website');
    expect(logo.width).toBeGreaterThan(0);
    expect(logo.height).toBeGreaterThan(0);
  });

  it.each(['/', '/behrend-open-house-activities/'])(
    'resolves the logo within the deployment base %s', (base) => {
      const source = element<HTMLImageElement>('header img').getAttribute('src')!;
      expect(new URL(source, `https://example.com${base}`).pathname)
        .toBe(`${base}PSU_EBO_RGB_2C.svg`);
    },
  );

  it('offers a skip link before other links targeting focusable main content', () => {
    const skip = element<HTMLAnchorElement>('a');
    expect(skip.textContent).toContain('Skip to main content');
    expect(skip.getAttribute('href')).toBe('#main-content');
    const target = element<HTMLElement>(skip.getAttribute('href')!);
    expect(target.tagName).toBe('MAIN');
    expect(target.getAttribute('tabindex')).toBe('-1');
  });

  it('renders routed activity content inside main while retaining the shared shell', async () => {
    const router = TestBed.inject(Router);
    const header = element('header');
    const footer = element('footer');
    await router.navigateByUrl('/challenge');
    await fixture.whenStable();
    expect(element('main h1').textContent).toBe('Binary challenge');
    expect(element('header')).toBe(header);
    expect(element('footer')).toBe(footer);
  });

  it('returns from an activity to home when the Open House link is clicked', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/challenge');
    await fixture.whenStable();
    element<HTMLAnchorElement>('header a[aria-label="Open House home"]').click();
    await fixture.whenStable();
    expect(router.url).toBe('/');
    expect(element('main h1').textContent).toBe('Choose a challenge');
  });

  it.each([
    ['Explore Behrend', 'https://behrend.psu.edu/'],
    ['More About Computer Science', 'https://behrend.psu.edu/school-of-engineering/academic-programs/computer-science'],
    ['More About Software Engineering', 'https://behrend.psu.edu/school-of-engineering/academic-programs/software-engineering'],
    ['Meet the Faculty', 'https://behrend.psu.edu/school-of-engineering/academic-programs/computer-science/faculty'],
  ])('links %s to the campus resource', (label, href) => {
    const nav = element('footer nav[aria-label="Campus resources"]');
    const link = Array.from(nav.querySelectorAll('a')).find((a) => a.textContent?.includes(label));
    expect(link?.getAttribute('href')).toBe(href);
  });

  it.each([
    ['Accessibility', 'https://www.psu.edu/accessibility'],
    ['Privacy', 'https://www.psu.edu/privacy'],
    ['Non-discrimination', 'https://policy.psu.edu/policies/ad85'],
  ])('provides the %s policy link', (label, href) => {
    const nav = element('footer nav[aria-label="University policies"]');
    const link = Array.from(nav.querySelectorAll('a')).find((a) => a.textContent?.trim() === label);
    expect(link?.getAttribute('href')).toBe(href);
  });

  it('keeps decorative external-link arrows out of accessible names', () => {
    const arrows = Array.from(root.querySelectorAll('a span')).filter((span) => span.textContent === '↗');
    expect(arrows.length).toBeGreaterThan(0);
    for (const arrow of arrows) {
      expect(arrow.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('identifies the campus and location in the footer', () => {
    expect(element('footer').textContent).toContain('Penn State Behrend');
    expect(element('footer').textContent).toContain('Erie, Pennsylvania');
  });

  it('uses the current year in the university copyright', () => {
    expect(element('footer small').textContent)
      .toBe(`© ${new Date().getFullYear()} The Pennsylvania State University`);
  });
});
