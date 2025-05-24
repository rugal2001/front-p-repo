import "@/styles/globals.css";
import "@/styles/tiptap.css";
import "@/styles/code-block-node.scss";
import { TooltipProvider } from "@/components/shadcn/tooltip";

function MyApp({ Component, pageProps }: { Component: any; pageProps: any }) {
  return (
    <>
      <TooltipProvider>
        <Component {...pageProps} />
      </TooltipProvider>
    </>
  );
}

export default MyApp;
