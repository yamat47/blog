import Layout, { siteTitle } from '../../components/layout'
import ShareButtons from '../../components/share-buttons'
import { getAllPostIds, getPostData } from '../../lib/posts'
import isPreviewing from '../../lib/preview'
import Head from 'next/head'
import Link from 'next/link'
import Time from '../../components/time'
import { GetStaticProps, GetStaticPaths } from 'next'

export default function Post({
  postData
}: {
  postData: {
    id: string
    title: string
    date: string
    thumbnail?: string
    contentHtml: string
  }
}) {
  // FIXME: 実装の都合でドメインやpathが固定されている。
  //        サイトの仕様が変わったらそれに追従しておかなければならない。
  const pageUrl = `https://blog.yamat47.me/posts/${postData.id}`
  const pageTitle = `${postData.title} | ${siteTitle}`
  const ogpImagePath = postData.thumbnail || '/images/ogp.png'
  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta property="og:title" content={`${postData.title} | ${siteTitle}`} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_BASE_URL}${ogpImagePath}`} />
        <script src="https://platform.twitter.com/widgets.js" />
      </Head>
      <article className='max-w-screen-md mx-auto px-2 md:px-4 lg:px-8' >
        <header className='mt-3 md:mt-6 mb-6 md:mb-12'>
          <div className='flex justify-start mb-1'>
            <span className='text-gray-500'>
              <Time dateString={postData.date} />
            </span>
          </div>
          <h1 className='text-3xl font-semibold mb-2'>
            {postData.title}
          </h1>
          <div className='flex justify-between mb-12'>
            <ShareButtons title={pageTitle} url={pageUrl} className='hidden sm:flex' />
          </div>
        </header>
        <div className='markdown' dangerouslySetInnerHTML={{ __html: postData.contentHtml }} />
        <hr className='mt-8 mb-4' />
        <ShareButtons title={pageTitle} url={pageUrl} />
      </article>
      <Link href="/">
        <a className='block border-t border-b border-gray-300 mt-6 mb-4 py-2 text-center'>
          <span className='text-sm font-semibold'>記事一覧</span>
        </a>
      </Link>
    </Layout>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllPostIds()
  return {
    paths,
    fallback: false
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const postData = await getPostData(params.id as string)
  const date = new Date(postData.date)

  // プレビューモードがオンかもしくは公開されていれば記事を開く。
  // プレビューモードがオフでかつ未公開の記事なら404を返す。
  if (isPreviewing || date <= new Date()) {
    return {
      props: {
        postData
      }
    }
  } else {
    return {
      notFound: true
    }
  }
}
