import Footer from "@/components/Footer";
import Goose from "@/components/Goose";
import Navbar from "@/components/Navbar";
import { NextSeo } from "next-seo";
import Head from "next/head";

export default function Custom500() {
  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NextSeo title="404 | Western Rank" description="Western Rank 404 Error" nofollow noindex />

      <div className={"overflow-hidden flex flex-col h-screen"}>
        <Navbar className="z-10 bg-transparent" />
        <div className="flex-grow h-full flex items-center justify-center pb-20">
          <Goose className="light h-[500px] w-[500px] stroke-1 stroke-muted-foreground opacity-40">
            <div className="w-full px-20">
              <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-purple-600 to-blue-400">
                HONK!
              </h1>
              <h2 className="text-xl">
                (Translation: <span className="font-bold">500</span> Error)
              </h2>
            </div>
          </Goose>
        </div>
        <Footer />
      </div>
    </>
  );
}
