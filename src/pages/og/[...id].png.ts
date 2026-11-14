import type { APIRoute, GetStaticPaths } from "astro";
import { ogCardResponse } from "../../lib/og";
import { getPosts, type Post } from "../../lib/posts";
import { SITE } from "../../site";

// The card a shared link to a post shows: its title over the site's name. The path follows the
// post's (/og/2026/01/01/130022.png for /entry/2026/01/01/130022).
export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { id: post.id }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ post: Post }> = ({ props }) =>
  ogCardResponse(props.post.data.title, SITE.title);
