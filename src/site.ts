export const SITE = {
  title: "blog.yamat47.me",
  description: "Notes by yamat47",
  author: "yamat47",
  url: "https://blog.yamat47.me",
  // Where the feed is published. Pages point feed readers here.
  feedPath: "/feed.xml",
  // The card a shared link shows for a page without one of its own.
  ogCardPath: "/og.png",
  // The page that searches the posts. Hatena Blog searched at the same path.
  searchPath: "/search",
  // The Google tag that reports visits to Google Analytics. Which Analytics property it reports
  // to is set in the tag's settings at Google, not here.
  googleTagId: "GTM-5PJ9MVKB",
  lang: "ja",
  // Dates are shown as the day they had in Japan, wherever the build runs.
  timeZone: "Asia/Tokyo",
} as const;
