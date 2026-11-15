# blog

The source of https://blog.yamat47.me/: posts written in Markdown, built into a static site with Astro and
served by GitHub Pages. The blog used to be on Hatena Blog; the posts written there keep their URLs.

## Where the conventions live

- Follow the `writing-conventions` skill for comments, commits, and PRs, and the `typescript-idioms` skill for TypeScript.
  Everything written around code (documents, comments, commits, PRs) is in English. The posts are in Japanese
- Check Dependabot PRs with the `review-dependency-bump` skill, and skill update PRs with the `review-skill-update` skill
- In `.claude/skills/`, use the imported version as is for any skill whose frontmatter `metadata.github-repo` is github-toolkit.
  Do not edit it directly. Rules specific to this repository live in this file; when they conflict with a skill, this file wins
- How to add a post, and what its frontmatter means, is in `posts/README.md`

## Layout

| Path | Contents |
|---|---|
| `posts/` | The posts: one folder per post, `index.md` with its images beside it |
| `src/content.config.ts` | The `posts` collection: where the files are and what frontmatter they must have |
| `src/pages/` | The routes: the list of posts (`index.astro`), a post (`entry/[...id].astro`), the 404 page, the feed (`feed.xml.ts`, with `feed.ts` and `rss.ts` at the paths Hatena Blog used), the card a shared link shows (`og/[...id].png.ts` for a post, `og.png.ts` for the other pages), the search page (`search.astro`), and the privacy policy (`privacy.astro`) |
| `src/layouts/`, `src/lib/`, `src/site.ts` | The page shell, helpers for posts, dates, the feed and the share card, the site's name, address and time zone |
| `fonts/` | The font the share cards are drawn with, where it is from (`README.md`), its license, and the font configuration that keeps other fonts out |
| `src/markdown/` | Plugins for the Markdown processor (Sätteri, configured in `astro.config.ts`): links between posts, link cards, image captions |
| `data/link-cards.json` | What link cards show about the pages posts link to. Written by the build when it fetches a new page, committed, and edited by hand for a page that cannot be fetched |
| `src/styles/` | `tokens.css` holds every design value; `global.css` uses them |
| `docker/` | Development image and compose |
| `Makefile` | Entry point for development commands |

## Always run commands through make

Node and pnpm are not installed on the host. The toolchain exists only inside the Docker container, and the `Makefile`
invokes it with `docker compose -f docker/compose.yaml run`.
**Do not run `pnpm` `npm` `npx` `node` `tsc` `biome` `astro` directly on the host** (`permissions.deny` in `.claude/settings.json` rejects them).

| Goal | Command |
|---|---|
| Typecheck, lint, test and build in one go | `make check` (CI runs the same, plus zizmor on the workflows) |
| Type check / lint / auto-fix / test | `make typecheck` / `make lint` / `make fix` / `make test` |
| Build the site | `make build` (`dist/`) |
| Dev server | `make up` (http://localhost:4321) / `make logs` / `make down` |
| The built site | `make preview` (http://localhost:4322) / `make down` |
| Add or update dependencies | `make pnpm ARGS="add -D <pkg>"` (the lockfile is also updated on the host) |
| First run, or after changing the Dockerfile | `make setup` |

## Rules that are easy to break

- **A published URL never changes.** A post's URL is `/entry/<id>`, where the id is its folder name, or its `slug` for a
  post moved from Hatena Blog (`/entry/2026/01/01/130022`). Renaming a published folder or editing a `slug` breaks links
  and bookmarks from outside
- **No trailing slash.** `astro.config.ts` builds each page as a file (`entry/foo.html`) so that GitHub Pages serves it at
  `/entry/foo` without a redirect. Write internal links without a trailing slash and without `.html`
- **Design values live in `src/styles/tokens.css` only.** Colors, sizes, weights and fonts are read through its variables
  everywhere else. The look is a placeholder: a design system in its own repository (pylon) will replace that file, and
  shared components will come from it. Do not grow a component library here. The share card is an image, so it keeps
  its pixel sizes in `src/lib/og-card.ts` and is drawn with the font in `fonts/`; its colors are read from `tokens.css`
- **Keep dependencies few.** The site was self-hosted once before and went back to Hatena because of upkeep. Prefer a
  small plugin written in this repository to a third-party integration, and make anything that fetches from the network
  at build time cache its result in the repository and fail soft, so that a dead link cannot block a post
- **Text from another site is never written as HTML.** A link card's title and description come from the linked page.
  They go into the Markdown tree as text nodes, which the processor escapes; do not build a card from an HTML string
- **A script from another site is loaded only by the pages that need it.** There are two. X's widget script is loaded
  only by a post with a tweet in it (`src/lib/tweets.ts`). Google's tag, which reports visits to Google Analytics, is
  needed on every page, so it is in the layout, and it loads only on the published host (`googleTagId` in
  `src/site.ts`). Do not put another such script in the layout. The privacy policy (`src/pages/privacy.astro`) says
  that the site uses Google Analytics, which its terms require of a site that reports to it: the two go together
- **Search exists only in a build.** The build runs Pagefind after Astro (`build` in `package.json`); it indexes the
  built pages and writes the index into `dist/pagefind/`. The dev server has the search page without an index and says
  so: look at search with `make preview`. Only what is inside a post's `<article>` is indexed (`data-pagefind-body`),
  less its link cards (`data-pagefind-ignore`); a page without that mark is never a search result
- TypeScript stays on 6 while `@astrojs/check` does not accept 7 (`.github/dependabot.yml` says when to lift that)
- Tests run on Node's own test runner (`node --test`, files named `*.test.ts` beside what they test), so a module a
  test loads imports its neighbours with the `.ts` extension. The pages themselves have no tests: they are verified by
  `make check` and a look at the page (`make up`)

## Deploying

`.github/workflows/deploy.yml` publishes to GitHub Pages. It runs by hand only until blog.yamat47.me points at GitHub
Pages; the comment at its top says what changes then. The repository's settings (Pages, required checks) are declared in
yamat47/infra-github, and the DNS record in yamat47/infra-yamat47.
