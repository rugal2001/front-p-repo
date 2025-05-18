import React from "react";
import Head from "next/head";

export default function TailwindTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Head>
        <title>Tailwind CSS Test</title>
      </Head>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="md:flex">
          <div className="md:shrink-0">
            <div className="h-48 w-full bg-blue-500 md:h-full md:w-48 flex items-center justify-center">
              <span className="text-white text-4xl font-bold">T</span>
            </div>
          </div>
          <div className="p-8">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
              Test Page
            </div>
            <p className="mt-2 text-slate-500">
              This page is testing if Tailwind CSS is working properly.
            </p>
            <div className="mt-4">
              <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400">
                Tailwind Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
