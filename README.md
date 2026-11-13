# blog

The source of https://blog.yamat47.me/. Posts are Markdown files under [`posts/`](posts/), built into a
static site with [Astro](https://astro.build/) and served by GitHub Pages.

## Writing a post

Add a folder with an `index.md` under `posts/`; [`posts/README.md`](posts/README.md) describes the
frontmatter and how the folder name becomes the URL.

Publishing is [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). It is run by hand until
blog.yamat47.me points at GitHub Pages; after that, merging a pull request into `main` publishes.

## Development

Everything runs in Docker; only Docker and `make` are needed on the host.

```sh
make setup   # build the image and install the dependencies
make up      # dev server at http://localhost:4321 (make down stops it)
make check   # typecheck, lint, and build
make help    # list the targets
```

The actions and the agent skills under `.claude/skills/` come from
[yamat47/github-toolkit](https://github.com/yamat47/github-toolkit).
