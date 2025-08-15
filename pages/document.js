// pages/_document.js
import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Basic meta */}
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="theme-color" content="#0b0b0f" />
          <meta name="color-scheme" content="dark light" />
          <meta
            name="description"
            content="Superfan — personalized live music alerts and discovery."
          />

          {/* Favicons / PWA */}
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="icon" type="image/png" sizes="32x32" href="/superfan-icon-light-32.png" />
          <link rel="icon" type="image/png" sizes="64x64" href="/superfan-icon-light-64.png" />
          <link rel="icon" type="image/png" sizes="128x128" href="/superfan-icon-light-128.png" />
          <link rel="icon" type="image/png" sizes="256x256" href="/superfan-icon-light-256.png" />
          <link rel="apple-touch-icon" href="/superfan-icon-light-256.png" />

          {/* Open Graph / Twitter (optional but nice) */}
          <meta property="og:title" content="Superfan" />
          <meta
            property="og:description"
            content="Connect Spotify, pick a location, and get show alerts for the artists you love."
          />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="/superfan-icon-light-512.png" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="Superfan" />
          <meta
            name="twitter:description"
            content="Personalized live music alerts and discovery."
          />
          <meta name="twitter:image" content="/superfan-icon-light-512.png" />

          {/* Preload (optional): if you add a webfont later, preload it here */}
          {/* <link rel="preload" as="font" href="/fonts/YourFont.woff2" type="font/woff2" crossOrigin="anonymous" /> */}
        </Head>
        <body>
          {/* NoScript message (optional) */}
          <noscript>
            <div style={{ padding: 16, background: '#201f2a', color: '#fff' }}>
              Superfan works best with JavaScript enabled.
            </div>
          </noscript>

          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
