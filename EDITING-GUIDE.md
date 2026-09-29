# Add your screenshots and finish the text

## 1. Add three images for each new project

Each new page has three slots: **cover**, **approach** and **decisions**.

| Project | Image folder |
| --- | --- |
| Renty Power | `assets/projects/renty-power/` |
| Satlantis | `assets/projects/satlantis/` |
| SEO Dashboard | `assets/projects/seo-dashboard/` |
| Order Cloud | `assets/projects/order-cloud/` |
| Sponsor App | `assets/projects/sponsor-app/` |
| Marketing Website | `assets/projects/marketing-website/` |

Place your image files in the relevant folder using these names:

```text
cover.png
approach.png
decisions.png
```

The build also accepts `.webp`, `.jpg`, `.jpeg`, `.avif` or `.svg`. Use one version per slot. If several exist, preference is WebP, PNG, JPG, JPEG, AVIF, then SVG. Use lowercase filenames and extensions.

For example, place `cover.png` in `assets/projects/renty-power/`, then run `node scripts/build.mjs` or commit to your Vercel-connected repository. The builder replaces that slot’s placeholder automatically. **Do not overwrite or rename the `-placeholder.svg` files.** They are regenerated whenever a real image is missing.

The image layouts preserve the complete screenshot rather than cutting off its edges. Use readable exports of roughly 1600–2400 pixels in width where available, and avoid shrinking an entire enormous Figma board into one image. Keep images reasonably compressed for loading speed.

After rebuilding, open `index.html` at the top level to see the new images. Vercel generates `dist/` automatically when deploying the complete project.

## 2. Edit the new case studies

Open `content/projects.json` in a text editor. Search for the project name.

| Field | What to edit |
| --- | --- |
| `name`, `title`, `summary` | The project name, main heading and introduction |
| `category`, `projectStage` | Product type and actual project stage |
| `role`, `scope` | Your precise responsibilities and deliverables |
| `context`, `challenge` | The real brief, user and problem |
| `approach` | The steps you actually took and why |
| `decisions` | Real design choices, rationale and trade-offs |
| `challenges` | Real constraints, drawbacks and limitations |
| `reflection`, `validation` | What you learned and what you would investigate next |
| `images` | Image labels, accessible descriptions and captions |
| `figmaUrl` | The optional supporting design-file link |
| `questions` | Prompts shown only while the page is a draft |
| `reviewStatus` | `draft` until you have confirmed the story; then `ready` |

Use normal text rather than HTML. Keep JSON quotation marks and commas intact. Use `\"` for a quotation mark inside a sentence, or use curly quotation marks. Running the build will report invalid JSON rather than silently publish broken pages.

Image captions currently suggest what to show. Replace them with descriptions of your actual screenshots. Update the `alt` text to describe what is visible for someone using a screen reader.

## 3. Remove the draft label when the story is accurate

After confirming the content, change this project’s setting:

```json
"reviewStatus": "ready"
```

Rebuild or commit. This removes the page’s draft banner, author questions, draft-only headings, homepage draft label and `noindex` meta tag. **It does not verify the claims for you.** Keep Satlantis’s `projectStage` as `Work in progress` while the design itself is unfinished; a case study can be fact-checked and ready even when its project is ongoing.

The pages avoid claiming measured results. If you later obtain legitimate outcome evidence, edit the relevant text and the outcome-note wording in `scripts/build.mjs` to reflect it accurately.

## 4. Edit the homepage and original case studies

Open the source files in `templates/` with a text editor (they deliberately have `.template` extensions):

- `index.html.template` · homepage, About, contact and shared navigation/footer
- `veritas.html.template` · Veritas / GP Flow
- `snapshot.html.template` · Snapshot Reviews
- `delil.html.template` · Delil AI
- `lillup.html.template` · Lillup

The additional-project list on the homepage is generated from `content/projects.json`. Change project names and categories there.

Styles are in `static/styles.css`, `static/layout.css` and `static/case-studies.css`. Image expansion is handled by `static/app.js`.

## 5. Set your own URL and profile image

You can leave `siteUrl` empty in `content/site.json`: Vercel’s build environment supplies the deployment domain. When using a custom domain, enter it there, for example `https://your-domain.com`, then rebuild. This sets the canonical URLs and social-preview image URLs.

To replace your portrait, save your own photo as `assets/Tatheer.png`. To replace your CV, save it as `assets/Tatheer-Ul-Hassan-CV.pdf`. Keep the filenames or update the matching links in `templates/`.
