import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.10";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string | undefined | null): value is string {
  return !!value && EMAIL_RE.test(value.trim());
}

async function getSmtpConfig(): Promise<Record<string, string>> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase.from("email_secrets").select("key, value");
  if (error) throw new Error(`Failed to load SMTP config: ${error.message}`);

  const config: Record<string, string> = {};
  for (const row of data ?? []) {
    config[row.key] = row.value;
  }
  return config;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, subject, html, text, from }: EmailRequest = await req.json();

    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = await getSmtpConfig();
    const host = config["SMTP_HOST"];
    const port = config["SMTP_PORT"];
    const user = config["SMTP_USER"];
    const pass = config["SMTP_PASS"];
    const fromAddress = config["SMTP_FROM"] || user;

    if (!host || !port || !user || !pass) {
      return new Response(JSON.stringify({
        error: "SMTP credentials not configured. Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM to the email_secrets table.",
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipients = Array.isArray(to) ? to : [to];

    for (const r of recipients) {
      if (!isValidEmail(r)) {
        return new Response(JSON.stringify({ error: `Invalid recipient address: ${r}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const emailBody = html
      ? html
      : (text || "").split("\n").map((line) => `<p style="margin:0 0 12px 0;line-height:1.6;color:#334155;">${line}</p>`).join("");

    const fullHtml = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,system-ui,sans-serif;"><div style="max-width:560px;margin:0 auto;padding:32px 24px;"><div style="background:#0b1120;border-radius:16px;overflow:hidden;border:1px solid #1e3a5f;"><div style="background:linear-gradient(135deg,#1e3a8a,#1e40af);padding:24px 32px;"><h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">NexusDesk AI</h1><p style="margin:4px 0 0 0;color:#bfdbfe;font-size:13px;">Service Operations Platform</p></div><div style="padding:32px;"><h2 style="margin:0 0 16px 0;color:#0f172a;font-size:18px;">${subject}</h2><div style="color:#334155;font-size:14px;line-height:1.7;">${emailBody}</div><hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" /><p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated notification from NexusDesk AI. Do not reply to this email.</p></div></div></div></body></html>`;

    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: from || fromAddress,
      to: recipients.join(", "),
      subject,
      html: fullHtml,
      text: text || subject,
    });

    return new Response(JSON.stringify({
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully",
      deliveredTo: recipients,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
