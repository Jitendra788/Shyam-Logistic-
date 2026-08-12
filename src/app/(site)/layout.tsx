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
      <main id="main-content" className="flex-1 pb-[5.5rem] lg:pb-0">
        {children}
      </main>
      <Footer settings={settings} />
      <MobileCallBar settings={settings} />
    </>
  );
}
