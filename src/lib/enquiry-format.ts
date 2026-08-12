import type { Enquiry } from "./types";

export function enquiryLines(
  enquiry: Pick<
    Enquiry,
    | "name"
    | "phone"
    | "email"
    | "company"
    | "fromCity"
    | "toCity"
    | "cargoType"
    | "weight"
    | "message"
  >
): string {
  return [
    `Name: ${enquiry.name}`,
    `Phone: ${enquiry.phone}`,
    enquiry.email ? `Email: ${enquiry.email}` : "",
    enquiry.company ? `Company: ${enquiry.company}` : "",
    enquiry.fromCity || enquiry.toCity
      ? `Route: ${enquiry.fromCity || "—"} → ${enquiry.toCity || "—"}`
      : "",
    enquiry.cargoType ? `Cargo: ${enquiry.cargoType}` : "",
    enquiry.weight ? `Weight: ${enquiry.weight}` : "",
    enquiry.message ? `Message: ${enquiry.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function whatsappEnquiryUrl(
  whatsappDigits: string,
  enquiry: Pick<
    Enquiry,
    | "name"
    | "phone"
    | "email"
    | "company"
    | "fromCity"
    | "toCity"
    | "cargoType"
    | "weight"
    | "message"
  >
) {
  const d = whatsappDigits.replace(/\D/g, "");
  const phone = d.length === 10 ? `91${d}` : d;
  if (!phone) return "";
  const text = `Hello SHYAM LOGISTIC, I want a freight quote.\n\n${enquiryLines(enquiry)}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
