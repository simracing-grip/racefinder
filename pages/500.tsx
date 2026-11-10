import Head from "next/head";
import ServerErrorScreen from "@/components/Brand/ServerErrorScreen";

// The static 500.html. When a server render fails on a cached (ISR) route —
// every /listings, /country and /category page — Next.js doesn't render
// app/error.tsx (a failed render is never cached, and a client-side
// navigation to it falls back to a full page load); it answers 500 with
// this static page. App-Router-only projects can't brand it (app/
// global-error.tsx isn't used for it), so this one Pages Router file is
// here purely to replace the built-in "This page couldn't load" screen.
export default function Custom500() {
  return (
    <>
      <Head>
        <title>Something went wrong | RaceFinder</title>
        <meta name="robots" content="noindex" />
      </Head>
      <style>{"html,body{margin:0;background:#07080b}"}</style>
      <ServerErrorScreen />
    </>
  );
}
