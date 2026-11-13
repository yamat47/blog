# Posts

One folder per post, holding `index.md` and the images it uses:

```
posts/
└── looking-back-2026/
    ├── index.md
    └── team-photo.jpg
```

The folder name is the last part of the post's URL: `posts/looking-back-2026/` is published at
`/entry/looking-back-2026`. Name it with lowercase letters, digits and hyphens; the build rejects
anything else. Changing it after publishing breaks every link to the post.

The folders that start with a date (`2022-11-11-leaving-crassone`) are the posts moved from Hatena
Blog. Their URL comes from `slug` (below), so the name is only for finding them. A new post has no
date in its folder name, because the name is its URL.

To link to another post, link to its file: `[クラッソーネを退職しました](../2022-11-11-leaving-crassone/index.md)`.
The build turns that into the post's URL and fails when there is no such post. A relative link to
anything else fails too, since nothing else beside a post is published except its images. This
covers links written in Markdown; a link inside raw HTML is left as it is. The dev server checks a
post's links when that post is saved, so a post renamed elsewhere shows up in `make check`.

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
