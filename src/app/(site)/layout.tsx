import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileCallBar } from "@/components/MobileCallBar";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <Header
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        phone={settings.phone}
        phone2={settings.phone2}
      />
      <div className="flex min-w-0 flex-1 flex-col pb-[max(5.5rem,env(safe-area-inset-bottom,0px)+4.75rem)] lg:pb-0">
        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
        <Footer settings={settings} />
      </div>
      <MobileCallBar settings={settings} />
    </>
  );
}
