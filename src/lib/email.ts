import nodemailer from "nodemailer";

/**
 * Custom SMTP email (Gmail App Password).
 * Does NOT use Supabase Auth email — avoids free-tier email limits.
 */
export function getMailer() {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER and EMAIL_APP_PASSWORD must be set in .env.local"
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from =
    process.env.EMAIL_FROM ||
    process.env.EMAIL_USER ||
    "noreply@jft.local";

  const transporter = getMailer();
  await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text || opts.html.replace(/<[^>]+>/g, ""),
  });
}

export async function sendVerificationEmail(
  to: string,
  confirmUrl: string
) {
  await sendEmail({
    to,
    subject: "JFT Platform — Confirm your email",
    html: `
      <p>Welcome to JFT Platform.</p>
      <p><a href="${confirmUrl}">Click here to verify your email</a></p>
      <p>If you did not register, ignore this message.</p>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
) {
  await sendEmail({
    to,
    subject: "JFT Platform — Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Reset password</a></p>
      <p>If you did not request this, ignore this message.</p>
    `,
  });
}
