// https://b.hatena.ne.jp/guide/bbutton を利用して生成した。

export default function HatenaBlogShareButton () {
  return (
    <span>
      <a
        href="https://b.hatena.ne.jp/entry/"
        className="hatena-bookmark-button"
        data-hatena-bookmark-layout="vertical-normal"
        data-hatena-bookmark-lang="ja"
        title="このエントリーをはてなブックマークに追加"
      >
        <img
          src="https://b.st-hatena.com/images/v4/public/entry-button/button-only@2x.png"
          alt="このエントリーをはてなブックマークに追加"
          width="20"
          height="20"
          style={{ border: 'none' }}
        />
      </a>
      <script
        type="text/javascript"
        src="https://b.st-hatena.com/js/bookmark_button.js"
        charSet="utf-8"
        async={true}
      />
    </span>
  )
}
