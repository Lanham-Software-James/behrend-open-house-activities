# BehrendOpenHouseActivities

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.8.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy-pages.yml` first runs the reusable
`.github/workflows/test.yml` workflow. All unit tests must pass before the build
starts; a failed or cancelled test job skips both build and deployment. The test
workflow also runs on pull requests and can be started manually from Actions.

After tests pass, the deployment workflow installs dependencies with
`npm ci`, builds the production application using Node.js 24, and publishes the
browser output to GitHub Pages. The base URL comes from the repository's Pages
configuration so assets load correctly under the repository path.

In the repository's **Settings → Pages → Build and deployment**, set **Source**
to **GitHub Actions**. After the workflow is merged into `main`, every push to
`main` deploys the site. You can also run **Deploy to GitHub Pages** manually from
the **Actions** tab with `main` selected. Other branches can build manually but
do not deploy.

The default site URL is
https://lanham-software-james.github.io/behrend-open-house-activities/.

To reproduce the Pages build locally:

```bash
npm ci
npm run build -- --configuration production --base-href /behrend-open-house-activities/
```

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
