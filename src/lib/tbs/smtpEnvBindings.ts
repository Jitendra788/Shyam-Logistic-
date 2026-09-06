function pick(...vals: Array<string | undefined>) {
  for (const v of vals) {
    const s = String(v || "")
      .trim()
      .replace(/^["']|["']$/g, "");
    if (s && s !== "[SENSITIVE]") return s;
  }
  return "";
}

/** Static process.env names so Vercel injects these into the send-doc function. */
export function smtpPassFromProcess() {
  return pick(process.env.GMAIL_APP_PASSWORD, process.env.SMTP_PASS).replace(/\s/g, "");
}

export function blobTokenFromProcess() {
  return pick(
    process.env.BLOB_READ_WRITE_TOKEN,
    process.env.VERCEL_BLOB_READ_WRITE_TOKEN,
  );
}
