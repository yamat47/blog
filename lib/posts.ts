import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import removeMd from 'remove-markdown'
import remark from 'remark'
import gfm from 'remark-gfm'
import breaks from 'remark-breaks'
import html from 'remark-html'
import highlight from 'remark-highlight.js'
import externalLinks from 'remark-external-links'
import linkCard from 'remark-link-card'

import isPreviewing from './preview'

const postsDirectory = path.join(process.cwd(), 'posts')

export function getSortedPostsData() {
  // Get file names under /posts
  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames.map(fileName => {
    // Remove ".md" from file name to get id
    const id = fileName.replace(/\.md$/, '')

    // Read markdown file as string
    const fullPath = path.join(postsDirectory, fileName)
    const fileContents = fs.readFileSync(fullPath, 'utf8')

    // Use gray-matter to parse the post metadata section
    const matterResult = matter(fileContents)

    // Combine the data with the id
    return {
      id,
      content: removeMd(matterResult.content),
      ...(matterResult.data as { date: string, title: string, thumbnail?: string })
    }
  })

  // Filter future posts
  const publishedPostsData = allPostsData.filter((postData) => {
    // プレビューモードのときは全ての記事を表示する。
    if (isPreviewing) {
      return true
    }

    return new Date(postData.date) <= new Date()
  })

  // Sort posts by date
  return publishedPostsData.sort((a, b) => {
    if (a.date < b.date) {
      return 1
    } else {
      return -1
    }
  })
}

export function getAllPostIds() {
  const fileNames = fs.readdirSync(postsDirectory)
  return fileNames.map(fileName => {
    return {
      params: {
        id: fileName.replace(/\.md$/, '')
      }
    }
  })
}

export async function getPostData(id: string) {
  const fullPath = path.join(postsDirectory, `${id}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents)

  // Use remark to convert markdown into HTML string
  const processedContent = await remark()
    .use(gfm)
    .use(breaks)
    .use(html)
    .use(highlight)
    .use(externalLinks)
    .use(linkCard)
    .process(matterResult.content)
  const contentHtml = processedContent.toString()

  // Combine the data with the id and contentHtml
  return {
    id,
    contentHtml,
    ...(matterResult.data as { title: string, date:string, thumbnail: string })
  }
}
