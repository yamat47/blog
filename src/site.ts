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
  lang: "ja",
  // Dates are shown as the day they had in Japan, wherever the build runs.
  timeZone: "Asia/Tokyo",
} as const;
