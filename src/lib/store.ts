import { promises as fs } from "fs";
import path from "path";
import type { Enquiry, SiteSettings } from "./types";

const dataDir = path.join(process.cwd(), "data");
const settingsPath = path.join(dataDir, "settings.json");
const enquiriesPath = path.join(dataDir, "enquiries.json");

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function getSettings(): Promise<SiteSettings> {
  const raw = await fs.readFile(settingsPath, "utf-8");
  return JSON.parse(raw) as SiteSettings;
}

export async function saveSettings(settings: SiteSettings): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), "utf-8");
}

export async function getEnquiries(): Promise<Enquiry[]> {
  try {
    const raw = await fs.readFile(enquiriesPath, "utf-8");
    return JSON.parse(raw) as Enquiry[];
  } catch {
    return [];
  }
}

export async function saveEnquiries(enquiries: Enquiry[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(enquiriesPath, JSON.stringify(enquiries, null, 2), "utf-8");
}

export async function addEnquiry(
  input: Omit<Enquiry, "id" | "status" | "createdAt">
): Promise<Enquiry> {
  const enquiries = await getEnquiries();
  const enquiry: Enquiry = {
    ...input,
    id: `enq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: "new",
    createdAt: new Date().toISOString(),
  };
  enquiries.unshift(enquiry);
  await saveEnquiries(enquiries);
  return enquiry;
}

export function formatLocation(loc: SiteSettings["locations"][number]): string {
  return [
    loc.addressLine1,
    loc.addressLine2,
    loc.locality,
    `${loc.city}, ${loc.state} ${loc.pincode}`,
  ]
    .filter(Boolean)
    .join(", ");
}

export function getPrimaryLocation(settings: SiteSettings) {
  return settings.locations.find((l) => l.isPrimary) ?? settings.locations[0];
}
