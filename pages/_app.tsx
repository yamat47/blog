import 'tailwindcss/tailwind.css'
import 'highlight.js/styles/github.css'
import '@yamat47/markdown-css/markdown.css'
import '../styles/global.css'
import '../styles/markdown/remark-link-card.css'
import '../styles/markdown/twitter.css'
import { AppProps } from 'next/app'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
