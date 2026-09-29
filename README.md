# Tatheer Ul Hassan · complete portfolio

This package contains the homepage, the four existing case studies and six new project pages: **11 pages in total**. The website is static HTML, CSS and JavaScript. A small Node script generates the new case studies from an editable JSON file. No framework, database, paid service, Python installation or npm dependencies are required.

## Start here

- Extract the **whole ZIP into a new folder**.
- Double-click **`index.html` at the top level** to open the fully styled website.
- Keep the CSS files and `assets/` folder beside it. No installation or build is needed to view it.
- Read `EDITING-GUIDE.md` for changing the copy and adding screenshots.
- Read `CONTENT-REVIEW.md` to finish the new case studies.
- `vercel.json` already contains the deployment settings.

The six additional case studies contain **proposed narrative**, based on the short project descriptions supplied. Their full Figma contents were not accessible for inspection. Role and scope use those descriptions; approaches, decisions and limitations need your confirmation. Each new page is visibly labelled as a draft and carries a `noindex` meta tag until you change its review status. No user interviews, performance metrics, launch outcomes or research results have been invented.

## Upload to a new Vercel project

1. Sign in at https://vercel.com/drop.
2. Upload this complete ZIP or its extracted project folder.
3. Choose your team, enter a project name, and select **Deploy**.

The project configuration sets **Framework: Other**, **Build Command: `node scripts/build.mjs`**, and **Output Directory: `dist`**. No environment variables are required. Vercel runs the build for you.

The ZIP also contains the finished site at its top level for opening on your computer. Vercel runs the supplied build and publishes only the generated `dist/` folder, so editable templates and guide files are not served with the website.

Vercel Drop creates a **new project** each time; it does not update your existing `tatheerux.vercel.app` project. To update that existing project, use its connected Git repository or link the Vercel CLI to that project.

## Use GitHub for ongoing edits

1. Create a repository and add the extracted package contents. `package.json` and `vercel.json` should be at the repository root.
2. Import the repository into Vercel, or connect it to the intended existing Vercel project.
3. Check the build settings listed above and deploy.
4. Future commits to the connected deployment branch trigger a new deployment.

When adding screenshots or editing the JSON through GitHub, Vercel regenerates the project pages automatically.

## Build locally

Install a current supported Node.js release, open a terminal in the extracted project folder and run:

```bash
node scripts/build.mjs
node scripts/check.mjs
```

No `npm install` is needed. Open `index.html` to review the result. The build also refreshes `dist/` for deployment. You can run `node scripts/check.mjs --deployment` to check that output.

Optional CLI deployment from the project root:

```bash
npx vercel
```

Follow the prompts and select the intended project when linking. Use `npx vercel --prod` when you want to publish the linked project to production.

## Contents

| Location | Purpose |
| --- | --- |
| `index.html` and the other top-level `.html` files | Ready-to-open homepage and 10 project pages |
| `styles.css`, `layout.css`, `case-studies.css`, `app.js` | Connected styles, bundled fonts and interactions |
| `assets/` | Screenshots, portrait and CV |
| `dist/` | Generated deployment output, created when the build runs |
| `content/projects.json` | Editable copy for the six new projects |
| `content/site.json` | Optional site URL and homepage description |
| `templates/` | Editable `.html.template` source for the homepage and four original case studies |
| `static/` | Editable CSS, browser JavaScript and favicon |
| `scripts/build.mjs` | Generates the website |
| `scripts/check.mjs` | Checks local links, image paths, page structure and project sections |
| `vercel.json` | Vercel configuration |

Keep all source folders when using the automatic build. Edits made directly to generated HTML or CSS at the top level are overwritten by the next build. Edit `templates/`, `content/` and `static/` instead. Images inside `assets/` are retained. Template files intentionally use a `.template` extension so they cannot be mistaken for the finished website.

## Contact, CV and profile photo

The existing contact details, LinkedIn URL, profile photo and original supplied resume are included. The CV has not been rewritten. Update these in `templates/` and `assets/` if needed; the build reuses the homepage header/footer for the new case studies.

DM Sans and Manrope are bundled inside the stylesheet. Styling, fonts and included images work offline; external Figma, LinkedIn and email links still need their normal applications or internet access. Font license notices are in `font-licenses/`.

## What was fixed

The original download placed the finished site in `public/` and included separate source HTML in `pages/`. Opening those source files could show unstyled pages because their CSS was in a different folder. This version puts every finished page and its CSS together at the top level, renames source templates, and includes fonts locally. The hosted portfolio’s layout, colours, spacing and interactions are preserved, along with all six additional project pages.

## Hosting documentation checked for this package

- Vercel Drop: https://vercel.com/docs/drop
- Vercel configuration: https://vercel.com/docs/project-configuration/vercel-json
- Deployments: https://vercel.com/docs/deployments
- CLI: https://vercel.com/docs/cli/deploying-from-cli

This package is ready to upload. It has not been deployed into your Vercel account.
