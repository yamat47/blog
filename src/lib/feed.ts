import { render } from "astro:content";
import type { APIRoute } from "astro";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { SITE } from "../site";
import { atomFeed, htmlForFeed } from "./atom";
import { getPosts, postPath } from "./posts";

/** The feed carries each post in full, so it holds the newest ones only. */
const FEED_POST_COUNT = 20;

/**
 * Answers with the feed.
 *
 * A post is rendered here as it is on its own page, images included, which is what Astro's
 * container is for: outside a page there is no other way to get a post's finished HTML. Astro
 * still exports the container as experimental. If it goes away, the build fails here, and the way
 * left is the post's `rendered.html` with each image resolved through `astro:assets`.
 */
export const GET: APIRoute = async () => {
  const container = await AstroContainer.create();
  const posts = (await getPosts()).slice(0, FEED_POST_COUNT);
  const entries = await Promise.all(
    posts.map(async (post) => {
      const { Content } = await render(post);
      return {
        url: new URL(postPath(post), SITE.url).href,
        title: post.data.title,
        publishedAt: post.data.publishedAt,
        html: htmlForFeed(await container.renderToString(Content), SITE.url),
      };
    }),
  );

  const feed = atomFeed({
    title: SITE.title,
    subtitle: SITE.description,
    author: SITE.author,
    lang: SITE.lang,
    siteUrl: new URL("/", SITE.url).href,
    feedUrl: new URL(SITE.feedPath, SITE.url).href,
    entries,
  });
  return new Response(feed, { headers: { "content-type": "application/atom+xml; charset=utf-8" } });
};
