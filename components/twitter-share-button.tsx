import Image from 'next/image'

export default function TwitterShareButton({ url, text }: { url: string, text: string }) {
  const encodedUrl = encodeURI(url)
  const encodedText = encodeURI(text)
  const href = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`

  return (
    <a
      className='px-4 py-1 inline-flex bg-twitter-blue hover:bg-twitter-blue-hover transition duration-100 rounded-md'
      href={href}
      target='_blank'
      rel='noopener'
    >
      <Image
        src='/images/twitter-logo.svg'
        alt='Twitter'
        width={16}
        height={16}
      />
      <span className='ml-2 text-white text-xs font-semibold'>
        ツイート
      </span>
    </a>
  )
}
