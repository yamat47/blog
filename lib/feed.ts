import RSS from 'rss';
import { getSortedPostsData } from './posts'

export function generateFeedXml() {
  const feed = new RSS({
    title: 'No Time To Sleep',
    description: 'ソフトウェアエンジニアがポエムを書いたり書評を書いたりアメフトを語ったり。',
    site_url: 'https://blog.yamat47.me',
    feed_url: 'https://blog.yamat47.me/feed',
    image_url: 'https://blog.yamat47.me/images/rss-image.png',
    copyright: 'Yamaguchi Takuya',
    language: 'ja',
    categories: ['Software Engineering'],
  });

  const posts = getSortedPostsData();
  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.content,
      url: `https://blog.yamat47.me/posts/${post.id}`,
      guid: post.id,
      author: 'Takuya Yamaguchi',
      date: new Date(post.date),
    });
  })

  return feed.xml();
}
