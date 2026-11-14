// Where Hatena Blog published the Atom feed, for the readers that subscribed there. The file has no
// extension, so GitHub Pages serves it as application/octet-stream: a reader that looks at the
// document keeps working, and one that trusts the content type does not. The feed itself says it
// lives at /feed.xml.
export { GET } from "../lib/feed";
