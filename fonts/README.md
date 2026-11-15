# Fonts

`NotoSansJP-Bold.otf` is the font the share cards are drawn with (`src/lib/og-card.ts`). It is
committed because neither the development container nor CI has a Japanese font.

| | |
|---|---|
| Font | Noto Sans JP Bold, version 2.004 |
| Copyright | © 2014-2021 Adobe (http://www.adobe.com/) |
| License | SIL Open Font License 1.1 (`LICENSE`, as published beside the font) |
| Source | https://github.com/notofonts/noto-cjk at commit `f8d157532fbfaeda587e826d4cd5b21a49186f7c`, `Sans/SubsetOTF/JP/NotoSansJP-Bold.otf` |
| SHA-256 | `1b0edfb500b73a4fa8a4fcaae1bbbd403994e08e73e3e0da37e70d3853f42c5f` |

To replace it, put the new file here, update this table, and change the file and family names in
`src/lib/og-card.ts`. `fonts.conf` needs no change: it names no font.
