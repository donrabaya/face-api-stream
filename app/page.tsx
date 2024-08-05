"use client";

import Image from "next/image";
import WebCamera from "./components/WebCamera";

export default function Home() {
  return (
    <main className="flex h-screen flex-col items-center justify-center py-[30px] px-[10px]">
      <WebCamera />
    </main>
  );
}
