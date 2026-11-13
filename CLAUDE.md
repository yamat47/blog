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
| `src/pages/` | The routes: the list of posts (`index.astro`), a post (`entry/[...id].astro`), the 404 page |
| `src/layouts/`, `src/lib/`, `src/site.ts` | The page shell, helpers for posts and dates, the site's name and time zone |
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
  shared components will come from it. Do not grow a component library here
- **Keep dependencies few.** The site was self-hosted once before and went back to Hatena because of upkeep. Prefer a
  small plugin written in this repository to a third-party integration, and make anything that fetches from the network
  at build time cache its result in the repository and fail soft, so that a dead link cannot block a post
- TypeScript stays on 6 while `@astrojs/check` does not accept 7 (`.github/dependabot.yml` says when to lift that)
- Tests run on Node's own test runner (`node --test`, files named `*.test.ts` beside what they test), so a module a
  test loads imports its neighbours with the `.ts` extension. The pages themselves have no tests: they are verified by
  `make check` and a look at the page (`make up`)

## Deploying

`.github/workflows/deploy.yml` publishes to GitHub Pages. It runs by hand only until blog.yamat47.me points at GitHub
Pages; the comment at its top says what changes then. The repository's settings (Pages, required checks) are declared in
yamat47/infra-github, and the DNS record in yamat47/infra-yamat47.
