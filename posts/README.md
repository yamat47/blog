# Posts

One folder per post, holding `index.md` and the images it uses:

```
posts/
└── looking-back-2026/
    ├── index.md
    └── team-photo.jpg
```

The folder name is the last part of the post's URL: `posts/looking-back-2026/` is published at
`/entry/looking-back-2026`. Name it in lowercase with hyphens; anything else is rewritten into that
form for the URL. Changing it after publishing breaks every link to the post.

## Frontmatter

```yaml
---
title: 2026年を振り返ってみる
publishedAt: "2026-12-31T17:48:53+09:00"
---
```

| Key | Required | Meaning |
|---|---|---|
| `title` | yes | The post's title |
| `publishedAt` | yes | When it was published, in quotes and with the `+09:00` offset. The build rejects a time without an offset, which would be read as UTC and could land on the wrong day |
| `slug` | no | Only for posts moved from Hatena Blog: the old path under `/entry/`, such as `2026/01/01/130022`. It replaces the folder name in the URL, so the folder can have a readable name |

A post in progress stays on its branch as a draft pull request, and merging it into `main` is what
publishes it (once the deploy workflow runs on `main`; see the repository README).
