import nodemailer from "nodemailer";

const COMPANY_NAME = "SHYAM LOGISTICS";

export async function sendPdfViaGmail(opts: {
  user: string;
  pass: string;
  to: string;
  subject: string;
  text: string;
  fileName: string;
  pdfBase64: string;
}) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: opts.user, pass: opts.pass.replace(/\s/g, "") },
  });
  await transporter.sendMail({
    from: `"${COMPANY_NAME}" <${opts.user}>`,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    attachments: [
      {
        filename: opts.fileName,
        content: Buffer.from(opts.pdfBase64, "base64"),
        contentType: "application/pdf",
      },
    ],
  });
}
