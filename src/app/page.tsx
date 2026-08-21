import { Suspense } from "react";
import SpinWheel from "@/components/SpinWheel";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-neutral-950 via-emerald-950 to-neutral-950 px-4 py-10">
      <div className="flex flex-col items-center text-center animate-[fade-in-up_0.5s_ease-out]">
        <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
          Spin &amp; Win{" "}
          <span className="bg-gradient-to-r from-amber-300 to-emerald-400 bg-clip-text text-transparent">
            Free Perfume
          </span>
        </h1>
      </div>

      <div className="mt-8">
        <Suspense fallback={null}>
          <SpinWheel />
        </Suspense>
      </div>
    </div>
  );
}
