function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function generateVerificationEmail(
  verificationUrl: string,
  brandName: string,
  expiryHours: number = 24
): string {
  const safeBrand = escapeHtml(brandName);
  const safeUrl = escapeHtml(verificationUrl);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:40px auto;background-color:#ffffff;border-radius:8px;overflow:hidden;">
    <tr>
      <td style="padding:40px 32px;text-align:center;">
        <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#18181b;">
          Verify your email for ${safeBrand}
        </h1>
        <p style="margin:0 0 32px;font-size:15px;line-height:1.6;color:#52525b;">
          Thanks for signing up! Click the button below to confirm your email address and join the waitlist.
        </p>
        <a href="${safeUrl}" style="display:inline-block;padding:12px 32px;background-color:#18181b;color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:500;">
          Verify Email
        </a>
        <p style="margin:32px 0 0;font-size:13px;line-height:1.5;color:#a1a1aa;">
          This link expires in ${expiryHours} hours. If you didn't sign up for ${safeBrand}, you can ignore this email.
        </p>
        <p style="margin:16px 0 0;font-size:12px;color:#d4d4d8;word-break:break-all;">
          ${safeUrl}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
