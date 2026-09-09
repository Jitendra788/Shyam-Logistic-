import { DEFAULT_MARK_URL } from "@/components/BrandLogo";
import { formatLocation, getPrimaryLocation, getSettings } from "@/lib/store";
import { LetterheadPrintButton } from "./LetterheadPrintButton";
import "./letterhead.css";

const FALLBACK = {
  companyName: "SHYAM LOGISTICS",
  gstin: "27AXGPL2293R1ZP",
  phone: "8459858242",
  phone2: "9057420562",
  email: "shyamlogisticscompany535@gmail.com",
  address:
    "Gate No.295/2, B/1, Near Laxmi Tekadi, Shri Mahalaxmi Petrol Pump 5 Star MIDC Kagal, Kolhapur. 416216",
};

function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
  return raw.trim();
}

export default async function LetterheadPage() {
  const settings = await getSettings();
  const company = settings.companyName || FALLBACK.companyName;
  const email = settings.email || FALLBACK.email;
  const gstin = settings.gstin || FALLBACK.gstin;
  const phone = formatPhone(settings.phone || FALLBACK.phone);
  const phone2 = formatPhone(settings.phone2 || FALLBACK.phone2);
  const primary = settings.locations?.length
    ? getPrimaryLocation(settings)
    : null;
  const address = primary ? formatLocation(primary) : FALLBACK.address;
  const logo = DEFAULT_MARK_URL;

  return (
    <div className="lh-page">
      <LetterheadPrintButton />
      <div className="lh-sheet-wrap">
        <article className="lh-sheet">
          <header className="lh-head">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="lh-logo" src={logo} alt={company} />
            <div className="lh-copy">
              <h1 className="lh-name">{company}</h1>
              <p className="lh-tag">Fleet Owners &amp; Transport Contractors</p>
              <p className="lh-line">{address}</p>
              <p className="lh-line">Email : {email}</p>
              <p className="lh-line">GST : {gstin}</p>
              <p className="lh-line lh-mob">
                Mob :{" "}
                <span>
                  {phone}
                  {phone2 ? ` , ${phone2}` : ""}
                </span>
              </p>
            </div>
          </header>
          <hr className="lh-rule" />
          <p className="lh-date">Date : ______ / ______ / 20______</p>
          <div className="lh-body" />
        </article>
      </div>
    </div>
  );
}
