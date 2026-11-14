const TWEET = /<blockquote\b[^>]*\bclass="[^"]*\btwitter-tweet\b/;

/**
 * Whether a post's rendered HTML holds a tweet. A tweet is written in a post as the HTML X gives
 * for embedding one: a blockquote of class `twitter-tweet`, which X's script turns into the tweet
 * as X shows it.
 *
 * The rendered HTML is asked, not the Markdown, so that a post which only shows that HTML as code
 * does not count: there it is escaped text.
 */
export function hasTweet(html: string): boolean {
  return TWEET.test(html);
}
