import Head from 'next/head'
import Layout, { siteTitle } from '../components/layout'
import { getSortedPostsData } from '../lib/posts'
import Link from 'next/link'
import Image from 'next/image'
import { GetStaticProps } from 'next'

export default function Home({
  allPostsData
}: {
  allPostsData: {
    title: string
    id: string
    content: string
    thumbnail: string
  }[]
}) {
  const ogpImagePath = '/images/ogp.png'

  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
        <meta property="og:title" content={siteTitle} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_BASE_URL}${ogpImagePath}`} />
      </Head>
      <div className='px-2 md:px-4 lg:px-8 grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
        {allPostsData.map(({ id, title, content, thumbnail }) => (
          <Link href={`/posts/${id}`} key={id}>
            <a className='group'>
              <article>
                <div className='flex flex-shrink-0 relative justify-center items-center w-full mb-2 group-hover:opacity-50'>
                  <img
                    src={thumbnail || '/images/thumbnail.png'}
                    alt={title}
                    className='rounded-md'
                  />
                </div>
                <h1 className='font-semibold mb-2'>
                  {title}
                </h1>
                <p className='text-sm font-light text-gray-500 mb-2'>
                  {content.substring(0, 50)}...
                </p>
              </article>
            </a>
          </Link>
        ))}
      </div>
    </Layout>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const allPostsData = getSortedPostsData()
  return {
    props: {
      allPostsData
    }
  }
}
