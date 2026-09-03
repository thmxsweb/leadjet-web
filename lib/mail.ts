import { Resend } from 'resend';

const from = process.env.EMAIL_FROM ?? 'leadjet <onboarding@resend.dev>';

export async function sendVerifyEmail(to: string, link: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not set.');
  const resend = new Resend(key);
  await resend.emails.send({
    from,
    to,
    subject: 'Verify your leadjet account',
    html: `
      <div style="font:15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;max-width:460px;margin:auto">
        <h2 style="margin:0 0 8px">Confirm your email</h2>
        <p style="color:#555">Welcome to <b>leadjet</b>. Click below to verify your account and start finding leads.</p>
        <p style="margin:24px 0">
          <a href="${link}" style="background:#e5484d;color:#fff;padding:11px 20px;border-radius:8px;text-decoration:none;font-weight:600">Verify my email</a>
        </p>
        <p style="color:#999;font-size:13px">Or paste this link: <br>${link}</p>
        <p style="color:#bbb;font-size:12px">This link expires in 24 hours. If you did not sign up, ignore this email.</p>
      </div>`,
  });
}
