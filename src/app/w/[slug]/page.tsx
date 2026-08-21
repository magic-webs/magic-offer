import { Suspense } from "react";
import { notFound } from "next/navigation";
import SpinWheel from "@/components/SpinWheel";
import { getCompanyBySlug, getPublicWheelConfig } from "@/lib/companies";

export default async function CompanyWheelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  if (!company) notFound();

  const config = company.isActive ? await getPublicWheelConfig(company.id) : null;

  const bgStyle = config?.bgImageUrl
    ? { backgroundImage: `url(${config.bgImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
    : undefined;

  return (
    <div
      className={`flex min-h-screen flex-col items-center px-4 py-10 ${
        bgStyle ? "" : "bg-gradient-to-b from-neutral-950 via-emerald-950 to-neutral-950"
      }`}
      style={bgStyle}
    >
      <div className="flex flex-col items-center text-center animate-[fade-in-up_0.5s_ease-out]">
        <img src="/images/spin-and-win.png" alt="Spin & Win" className="w-full max-w-md" />
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
              pinImageUrl={config.pinImageUrl ?? undefined}
              formFields={config.fields}
              initialSettings={{ askName: config.askName, askPhone: config.askPhone }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
