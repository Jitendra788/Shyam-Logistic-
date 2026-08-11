import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
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
      <Header companyName={settings.companyName} logoUrl={settings.logoUrl} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
