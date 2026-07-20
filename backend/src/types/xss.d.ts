declare module 'xss' {
  interface XssOptions {
    whiteList?: Record<string, string[]>
    stripIgnoreTag?: boolean
    stripIgnoreTagBody?: string[] | boolean
    allowCommentTag?: boolean
    stripBlankChar?: boolean
    css?: boolean
    [key: string]: unknown
  }

  interface Xss {
    (str: string, options?: XssOptions): string
    DEFAULT_OPTIONS: XssOptions
  }

  const xss: Xss
  export = xss
}
