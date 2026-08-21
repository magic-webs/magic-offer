import { Suspense } from "react";
import { notFound } from "next/navigation";
import SpinWheel from "@/components/SpinWheel";
import { getCompanyBySlug, getPublicWheelConfig } from "@/lib/companies";

export default async function CompanyWheelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const config = company.isActive ? await getPublicWheelConfig(company.id) : null;

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-neutral-950 via-emerald-950 to-neutral-950 px-4 py-10">
      <div className="flex flex-col items-center text-center animate-[fade-in-up_0.5s_ease-out]">
        <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
          Spin &amp; Win{" "}
          <span className="bg-gradient-to-r from-amber-300 to-emerald-400 bg-clip-text text-transparent">
            {company.name}
          </span>
        </h1>
      </div>

      <div className="mt-8">
        {!company.isActive && <p className="text-sm text-gray-400">This wheel isn&apos;t currently active.</p>}
        {company.isActive && !config && (
          <p className="text-sm text-gray-400">This wheel isn&apos;t set up yet — check back soon!</p>
        )}
        {config && (
          <Suspense fallback={null}>
            <SpinWheel
              companySlug={slug}
              prizes={config.prizes}
              wheelImageUrl={config.wheelImageUrl ?? ""}
              initialSettings={{ askName: config.askName, askPhone: config.askPhone }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
