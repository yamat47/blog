// プレビューモードをオンにするかどうかの設定。
// VercelでProductionとして起動しているときだけfalseを返す。
const mode: string | undefined = process.env.VERCEL_ENV
const isPreviewing: boolean = (mode === 'preview' || typeof mode === 'undefined')

export default isPreviewing
