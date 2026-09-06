import nodemailer from "nodemailer";
import { loadBrandPngBytes } from "@/lib/tbs/embedBrandPng";

const COMPANY_NAME = "SHYAM LOGISTICS";

async function sendWith(opts: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  fileName: string;
  pdfBytes: Buffer;
  logoBytes?: Uint8Array | null;
}) {
  const transporter = nodemailer.createTransport({
    host: opts.host,
    port: opts.port,
    secure: opts.secure,
    auth: { user: opts.user, pass: opts.pass },
  });
  const attachments: nodemailer.SendMailOptions["attachments"] = [
    {
      filename: opts.fileName,
      content: opts.pdfBytes,
      contentType: "application/pdf",
    },
  ];
  if (opts.logoBytes?.length) {
    attachments.unshift({
      filename: "shyam-logo.png",
      content: Buffer.from(opts.logoBytes),
      contentType: "image/png",
      cid: "shyam-logo",
      contentDisposition: "inline",
    });
  }
  await transporter.sendMail({
    from: `"${COMPANY_NAME}" <${opts.user}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    attachments,
  });
}

export async function sendPdfViaGmail(opts: {
  user: string;
  pass: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  fileName: string;
  pdfBase64?: string;
  pdfBytes?: Uint8Array;
}) {
  const pass = opts.pass.replace(/\s/g, "");
  const pdfBytes = opts.pdfBytes
    ? Buffer.from(opts.pdfBytes)
    : Buffer.from(String(opts.pdfBase64 || ""), "base64");
  if (pdfBytes.length < 80) throw new Error("PDF missing");
  const logoBytes = await loadBrandPngBytes("shyam-peacock-mark-print.png");
  const common = {
    user: opts.user,
    pass,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    fileName: opts.fileName,
    pdfBytes,
    logoBytes,
  };
  try {
    await sendWith({
      ...common,
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
    });
  } catch {
    await sendWith({
      ...common,
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
    });
  }
}
