import nodemailer from "nodemailer";

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
  fileName: string;
  pdfBytes: Buffer;
}) {
  const transporter = nodemailer.createTransport({
    host: opts.host,
    port: opts.port,
    secure: opts.secure,
    auth: { user: opts.user, pass: opts.pass },
  });
  await transporter.sendMail({
    from: `"${COMPANY_NAME}" <${opts.user}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    attachments: [
      {
        filename: opts.fileName,
        content: opts.pdfBytes,
        contentType: "application/pdf",
      },
    ],
  });
}

export async function sendPdfViaGmail(opts: {
  user: string;
  pass: string;
  to: string;
  subject: string;
  text: string;
  fileName: string;
  pdfBase64?: string;
  pdfBytes?: Uint8Array;
}) {
  const pass = opts.pass.replace(/\s/g, "");
  const pdfBytes = opts.pdfBytes
    ? Buffer.from(opts.pdfBytes)
    : Buffer.from(String(opts.pdfBase64 || ""), "base64");
  if (pdfBytes.length < 80) throw new Error("PDF missing");
  const common = {
    user: opts.user,
    pass,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    fileName: opts.fileName,
    pdfBytes,
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
