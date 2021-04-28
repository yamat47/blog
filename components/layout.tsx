import Head from 'next/head'
import Link from 'next/link'

export const siteTitle = 'No Time To Sleep'
export const siteDescription = 'ソフトウェアエンジニアがポエムを書いたり書評を書いたりアメフトを語ったり。'

export default function Layout({
  children,
  home
}: {
  children: React.ReactNode
  home?: boolean
}) {
  return (
    <div className='flex flex-col min-h-screen'>
      <Head>
        <link rel="icon" href="/favicon.png" />
        <meta name="description" content={siteDescription} />
        <meta property="og:url" content="" />
        <meta property="og:description" content={siteDescription} />
        <meta property="og:site_name" content={siteTitle} />
        <meta property="twitter:card" content="summary_large_image" />
      </Head>
      <header className='pt-8 pb-4'>
        <div className='flex justify-center mb-4'>
          <Link href="/">
            <a className='inline-block'>
              <img
                className='h-12 md:h-16'
                src="/images/logo.png"
                alt='No Time To Sleep'
              />
            </a>
          </Link>
        </div>
        <p className='px-2 text-sm text-center text-gray-500'>
          ソフトウェアエンジニアがポエムを書いたり書評を書いたりアメフトを語ったり。
        </p>
      </header>
      <main className='container flex-auto pt-4 mx-auto mt-4 border-t-4 border-gray-500'>
        {children}
      </main>
      <footer className='py-4 mx-auto'>
        Hosted by Yamaguchi Takuya
        <a href='https://twitter.com/yamat47' target='_blank' rel='noopener'>
          <img
            className='inline-block h-6 ml-2'
            src="/images/icons/twitter.svg"
            alt='yamat47'
          />
        </a>
      </footer>
    </div>
  )
}
