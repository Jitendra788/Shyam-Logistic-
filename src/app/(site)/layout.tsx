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
      <Header
        companyName={settings.companyName}
        logoUrl={settings.logoUrl}
        phone={settings.phone}
        phone2={settings.phone2}
      />
      <main className="flex-1 pb-[5.5rem] lg:pb-0">{children}</main>
      <Footer settings={settings} />
      <MobileCallBar settings={settings} />
    </>
  );
}
