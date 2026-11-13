import { type CollectionEntry, getCollection } from "astro:content";

export type Post = CollectionEntry<"posts">;

/** Every post, newest first. */
export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("posts");
  return posts.sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf());
}

/** The post's URL path. The id is the folder name, or the `slug` a post moved from Hatena sets. */
export function postPath(post: Post): string {
  return `/entry/${post.id}`;
}
