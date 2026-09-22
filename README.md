# Penn State Behrend Open House Activities

**Think you can beat the computer?** An interactive application for Computer Science and Software Engineering Open Houses at Penn State Behrend. Prospective students explore algorithms, binary numbers, and networks through short challenges that need no programming experience.

The activities are designed to start conversations with students and faculty: try a problem, see how a computer solves it, and discover the idea behind the result.

[Open the application](https://csse-open-house.jameslanham.net/)

## Activities

| Activity | What visitors do | What they learn |
| --- | --- | --- |
| **Beat Binary Search** | Guess a random number from 1–100 using higher/lower hints, then watch binary search find the same number. Results compare the visitor’s guesses with the algorithm’s actual guess count. | Checking midpoints eliminates half the remaining possibilities each time. |
| **Find the Shortest Path** | Click connected graph nodes to build a route from START to FINISH. Watch Dijkstra’s algorithm overlay its progress and optimal route on the map. | Weighted graphs model costs, and the cheapest route is not necessarily the one with the fewest edges. |
| **Binary Challenge** | Toggle eight bits to make three random target numbers while an elapsed timer runs. | Each binary position is worth a power of two; eight bits represent numbers from 0–255. |

Binary Challenge targets increase in range across three rounds: **1–15**, **16–63**, and **64–255**. Shortest Path generates connected maps with **7 nodes**, **9 edges**, and costs from **1–9**; fixed node positions keep the randomized connections readable.

Each activity supports replay. Game state lives in the browser’s memory; refreshing the page or leaving an activity starts a fresh session. There are no accounts, backend services, or persistent leaderboards.

## Run locally

Use **Node.js 24** and npm, matching the GitHub Actions environment.

```bash
npm ci
npm start
```

Open [localhost:4200](http://localhost:4200/). The development server updates the page as source files change.

| Route | Page |
| --- | --- |
| `/` | Activity homepage |
| `/activities/beat-binary-search` | Beat Binary Search |
| `/activities/shortest-path` | Find the Shortest Path |
| `/activities/binary-challenge` | Binary Challenge |

## Project structure

The application uses Angular standalone components, lazy-loaded routes, signals for game state, and component-scoped CSS.

```text
src/app/
  app.*                         Shared header, footer, and page layout
  app.routes.ts                 Homepage and activity routes
  home/
    home.ts                     Activity array: text, order, routes, themes, previews
    home.html                   Shared card template and generic preview outlet
    activity.ts                 Activity and preview data types
    previews/                   Graph, search, and binary card illustrations
  activities/
    beat-binary-search/
      search-replay/            Visual replay and binary search step generation
    binary-challenge/           Bit toggles, random targets, and session timer
    shortest-path/
      graph.ts                  Connected graph generation and Dijkstra’s algorithm
public/
  PSU_EBO_RGB_2C.svg             Penn State Behrend logo
```

To update homepage cards, edit the `activities` array in `src/app/home/home.ts`. Array order controls display order. Each entry defines its copy, route, theme, preview component, and preview input data. `NgComponentOutlet` renders the selected illustration without activity-specific branches in the homepage template.

The **light** theme is used for Shortest Path and Binary Challenge previews; the **dark** theme is used for Beat Binary Search. The card bodies remain white. Shared colors and typography are defined in `src/styles.css`, using Penn State’s navy, blue, and Roboto typography.

To add an activity, create its component under `src/app/activities/`, register a lazy-loaded route in `app.routes.ts`, and add a homepage array entry. Add a preview component if it needs a new illustration and tests for its gameplay and navigation.

## Testing

Run the full suite once, as CI does:

```bash
npm test -- --watch=false
```

Run tests interactively during development:

```bash
npm test
```

Tests use Vitest and jsdom through Angular’s test builder. Coverage includes:

- Shared layout, navigation, accessible labels, and homepage data-driven rendering.
- Bounded random targets, guess validation, scoring, replay, and timer cleanup.
- Binary search correctness for every target from 1–100.
- Dijkstra results compared with exhaustive path search on 100 seeded random maps.
- Graph mouse/keyboard interactions, algorithm overlays, and reset behavior.

The unit/component suite does not replace visual browser checks. When changing layouts or interactions, also check narrow screens, keyboard navigation, focus visibility, and reduced-motion behavior. No separate end-to-end test runner is configured.

## Build and deployment

```bash
npm run build
```

The production site is generated in `dist/behrend-open-house-activities/browser/`.

GitHub Pages deployment follows **tests → build → deploy**:

- `.github/workflows/test.yml` runs on pull requests and can be started manually. It is also a reusable workflow called by the deployment workflow.
- `.github/workflows/deploy-pages.yml` runs on pushes to `main` or manual dispatch. Its production build waits for tests to pass; deployment waits for the build and only runs on `main`.
- Failed or cancelled tests prevent the production build and deployment. Manually running the test workflow alone does not deploy anything.

In repository **Settings → Pages**, the publishing source should be **GitHub Actions**. To redeploy, run **Deploy to GitHub Pages** from the Actions tab with `main` selected.

The deployment workflow reads the base path from the repository’s Pages configuration. For the custom domain, the application is served at `/`. To reproduce that build:

```bash
npm run build -- --configuration production --base-href /
```

If hosting under the default repository URL instead, the base path is `/behrend-open-house-activities/`. After changing the Pages domain, rerun the deployment so asset URLs use the new base path. An outdated base path can cause JavaScript requests to return an HTML 404 page, which the browser reports as a MIME-type error.

The app uses client-side routes. For visitor links on GitHub Pages, use the homepage and navigate through the cards; direct visits or refreshes on an activity URL require a hosting fallback that this repository does not currently configure.

## Design and accessibility

The interface follows the existing Penn State Behrend visual identity with large controls, clear instructions, and explanations connecting each game to computer science. Graph nodes support mouse clicks and keyboard activation; guessing forms support Enter; status messages announce feedback. Algorithm demonstrations respect reduced-motion preferences.

Keep the supplied logo’s colors and proportions intact, and use the [Penn State Design Toolkit](https://brand.psu.edu/design-toolkit) when extending the visual design.
