import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/png" sizes="32x32" href="/superfan-icon-light-32.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/superfan-icon-light-64.png" />
        <link rel="apple-touch-icon" href="/superfan-icon-light-256.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
