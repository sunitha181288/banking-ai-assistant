import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#030712" />
        <title>NexaBank AI — Contact Center Intelligence</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
