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

## Links to other posts

To link to another post, link to its file: `[クラッソーネを退職しました](../2022-11-11-leaving-crassone/index.md)`.
The build turns that into the post's URL and fails when there is no such post. A relative link to
anything else fails too, since nothing else beside a post is published except its images. This
covers links written in Markdown; a link inside raw HTML is left as it is.

The dev server checks a post's links when that post is saved. It reports a bad one in its log
(`make logs`) and keeps showing the post as it was, and it does not notice a post renamed
elsewhere. `make check` catches both.

## Link cards

A link alone in its paragraph, with a blank line before and after it, becomes a card:

```markdown
https://example.com/some/page

[クラッソーネを退職しました](../2022-11-11-leaving-crassone/index.md)
```

- A bare URL becomes a card with the page's title, description, site name and thumbnail. A link
  with words of its own (`[the guide](https://example.com/guide)`) stays a link, and so does a URL
  inside a sentence, a list or a quote, or on a line right under another URL.
- A link to another post becomes a card with that post's title and date.

The first build after a URL is added (`make check`, or the dev server) fetches the page and writes
what it found to `data/link-cards.json`. Commit that file with the post: from then on the card is
built from it, without the network, and stays the same when the page changes or disappears. CI
fails a pull request whose build still had a page to fetch.

A page that cannot be fetched still gets a card, showing its URL, and the build goes on. Some
sites refuse programs and some are gone; for those, add the entry to `data/link-cards.json` by
hand (only `title` is required). To fetch a page again, delete its entry.

The thumbnail is loaded from the other site when a reader opens the post. One that no longer
exists leaves its place on the card tinted.

## Images and captions

Put an image in the post's folder and link to it by its file name: `![花束の写真](./flowers.jpg)`.
The words in the brackets are for a reader who cannot see the image.

To show a caption under an image, give it a title, and leave the image alone in its paragraph:

```markdown
![花束の写真](./flowers.jpg "最終日に花束をいただきました")
```

An image inside a sentence gets no caption; there its title stays a tooltip.

## Tweets

To show a tweet, paste the HTML that X gives under "Embed post" (the `<blockquote
class="twitter-tweet">` part; leave out the `<script>` line that follows it). A post that has one
loads X's script, which turns the quote into the tweet as X shows it. Where the script does not
run, or once the tweet is deleted, the quote stays: the text, the author and a link.

## What a shared link shows

Where a link to a post is shared (X, Slack and so on), it shows a card and a few lines of text.
Both are made by the build; a post sets neither.

- The card is an image of the post's title over the site's name. A long title is drawn smaller
  so that it fits. The card's font has no emoji, so one in a title is drawn as a small box there.
- The text is the start of the post, without its headings, code blocks and link cards.

## Search

The search page (`/search`) finds a post by its title and by what it says, a tweet it quotes
included. The words of a link card are not searched: a card is a preview of another page, and its
words are that page's, not the post's.

Nothing needs doing for a new post. The build makes the index from the built pages, so a post is
found from the deploy that publishes it. The dev server has no index; `make preview` serves a
build, where search works.

## Drafts

A post in progress stays on its branch as a draft pull request, and merging it into `main` is what
publishes it.
