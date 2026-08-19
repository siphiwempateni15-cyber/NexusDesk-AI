import { supabase } from './supabase';

interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  message: string;
  needsApiKey?: boolean;
}

async function logNotification(params: {
  ticketId: string | null;
  channel: 'Email' | 'In-App';
  recipient: string;
  subject: string;
  body: string;
  status: 'Queued' | 'Sent' | 'Delivered' | 'Failed';
  trigger: string;
}): Promise<void> {
  try {
    await supabase.from('notification_log').insert({
      ticket_id: params.ticketId,
      channel: params.channel,
      recipient: params.recipient,
      subject: params.subject,
      body: params.body,
      status: params.status,
      trigger: params.trigger,
    });
  } catch {
    // notification logging is best-effort — never block the user flow
  }
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: SendEmailParams): Promise<SendEmailResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return {
      success: false,
      message: 'Supabase environment variables are not configured.',
    };
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${session?.access_token ?? anonKey}`,
      },
      body: JSON.stringify({ to, subject, text, html }),
    });

    const payload: unknown = await response.json().catch(() => null);
    const error =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : undefined;

    if (!response.ok) {
      if (response.status === 503) {
        return {
          success: false,
          message:
            'Email not configured. Add SMTP credentials (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM) to Supabase Edge Function secrets.',
          needsApiKey: true,
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          message:
            'The send-email Supabase Edge Function was not found. Deploy it before sending emails.',
        };
      }

      return {
        success: false,
        message: error ?? `Failed to send email (${response.status}).`,
      };
    }

    const data =
      payload && typeof payload === 'object'
        ? (payload as { success?: boolean; messageId?: string; error?: string; message?: string })
        : {};

    if (!data.success) {
      return {
        success: false,
        message: data.error ?? 'The email service returned an unknown error.',
      };
    }

    return {
      success: true,
      messageId: data.messageId,
      message: data.message ?? 'Email sent successfully.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error.',
    };
  }
}

export async function sendNotificationEmail(notification: {
  recipient: string;
  subject: string;
  body: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: notification.recipient,
    subject: notification.subject,
    text: notification.body,
  });
}

export interface TicketEmailData {
  ticketId: string;
  ticketDbId?: string | null;
  subject: string;
  category: string;
  priority: string;
  department: string;
  status: string;
  aiResponse: string;
  recipient: string;
  customerName?: string;
}

export async function sendTicketCreatedEmail(data: TicketEmailData): Promise<SendEmailResult> {
  const subject = `[${data.ticketId}] Your request has been received — ${data.subject}`;
  const slaHours: Record<string, number> = { Low: 48, Medium: 24, High: 8, Critical: 2 };
  const sla = slaHours[data.priority] ?? 24;
  const greetingName = (data.customerName ?? '').trim();
  const greeting = greetingName
    ? `Dear ${greetingName.split(/\s+/)[0]},`
    : 'Thank you for contacting the service desk.';

  const html = `
    <p style="margin:0 0 16px 0;">${greeting}</p>
    <p style="margin:0 0 16px 0;">Your support request has been received and automatically classified by our AI engine. Below is a full summary of your ticket and what happens next.</p>

    <p style="font-weight:600;margin:24px 0 8px 0;font-size:15px;">Ticket Summary</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px 0;">
      <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;width:140px;">Ticket ID</td><td style="padding:8px 12px;">${data.ticketId}</td></tr>
      <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">Subject</td><td style="padding:8px 12px;">${data.subject}</td></tr>
      <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">Category</td><td style="padding:8px 12px;">${data.category}</td></tr>
      <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">Priority</td><td style="padding:8px 12px;">${data.priority}</td></tr>
      <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">Routed To</td><td style="padding:8px 12px;">${data.department}</td></tr>
      <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">Current Status</td><td style="padding:8px 12px;">${data.status}</td></tr>
    </table>

    <p style="font-weight:600;margin:24px 0 8px 0;font-size:15px;">What Happens Next</p>
    <ol style="margin:0 0 16px 0;padding-left:20px;line-height:1.8;color:#334155;">
      <li><strong>AI Classification Complete</strong> — Your request has been categorised as <em>${data.category}</em> with <em>${data.priority}</em> priority and routed to the <em>${data.department}</em> team.</li>
      <li><strong>Team Review</strong> — A member of the ${data.department} team will review your request. The target response time for ${data.priority} priority tickets is <strong>${sla} hours</strong>.</li>
      <li><strong>Progress Updates</strong> — You will receive an email each time the status of your ticket changes (e.g. when work begins, when it is escalated, and when it is resolved).</li>
      <li><strong>Resolution</strong> — Once the team has addressed your request, the ticket will be marked as Resolved and you will receive a final confirmation email.</li>
    </ol>

    <p style="font-weight:600;margin:24px 0 8px 0;font-size:15px;">AI-Generated Initial Response</p>
    <div style="background:#f8fafc;border-left:4px solid #1e40af;padding:16px;border-radius:8px;margin:0 0 16px 0;">
      <pre style="margin:0;white-space:pre-wrap;font-family:inherit;font-size:13px;line-height:1.7;color:#334155;">${data.aiResponse}</pre>
    </div>

    <p style="font-weight:600;margin:24px 0 8px 0;font-size:15px;">Track Your Ticket</p>
    <p style="margin:0 0 8px 0;">You can track the full progress of your ticket at any time through the customer portal. Sign in and navigate to <strong>My Tickets</strong> to see the live status, progress timeline, and all updates from our team.</p>

    <p style="margin:24px 0 0 0;color:#94a3b8;font-size:12px;">This is an automated notification from NexusDesk AI. Please do not reply to this email.</p>
  `;

  const result = await sendEmail({ to: data.recipient, subject, html });

  await logNotification({
    ticketId: data.ticketDbId ?? null,
    channel: 'Email',
    recipient: data.recipient,
    subject,
    body: data.aiResponse,
    status: result.success ? 'Sent' : 'Failed',
    trigger: 'AUTO_ROUTE',
  });

  return result;
}

export async function sendTicketStatusEmail(data: TicketEmailData & { previousStatus: string }): Promise<SendEmailResult> {
  const subject = `[${data.ticketId}] Status update — ${data.subject}`;

  const statusExplanation: Record<string, string> = {
    'Open': 'Your ticket is in the queue and waiting to be picked up by the team. No action is needed from you at this time.',
    'In Progress': 'A team member is now actively working on your request. They will update the ticket again once they have made progress or need further information from you.',
    'Resolved': 'Your request has been marked as resolved. If the issue is not fully addressed, please submit a new ticket through the customer portal and reference this ticket ID.',
    'Escalated': 'Your request has been escalated for urgent senior attention. The on-duty team lead has been notified and will prioritise your case. You will receive another update as soon as the escalated team begins work.',
  };

  const nextSteps: Record<string, string> = {
    'Open': 'Please wait for the team to begin work. You will be notified when the status changes.',
    'In Progress': 'No action is required from you right now. If the team needs more information, they will reach out via email or update the ticket.',
    'Resolved': 'If you are satisfied with the resolution, no further action is needed. If not, please submit a new ticket referencing this ticket ID.',
    'Escalated': 'An escalation specialist will contact you shortly. Please keep an eye on your inbox for follow-up questions.',
  };

  const html = `
    <p style="margin:0 0 16px 0;">Hi there,</p>
    <p style="margin:0 0 16px 0;">The status of your support request has been updated. Here are the details:</p>

    <table style="width:100%;border-collapse:collapse;margin:0 0 16px 0;">
      <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;width:140px;">Ticket ID</td><td style="padding:8px 12px;">${data.ticketId}</td></tr>
      <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">Subject</td><td style="padding:8px 12px;">${data.subject}</td></tr>
      <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">Previous Status</td><td style="padding:8px 12px;">${data.previousStatus}</td></tr>
      <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">New Status</td><td style="padding:8px 12px;font-weight:700;color:${data.status === 'Resolved' ? '#16a34a' : data.status === 'Escalated' ? '#dc2626' : '#1e40af'};">${data.status}</td></tr>
      <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;">Department</td><td style="padding:8px 12px;">${data.department}</td></tr>
    </table>

    <p style="font-weight:600;margin:24px 0 8px 0;font-size:15px;">What This Means</p>
    <p style="margin:0 0 16px 0;line-height:1.7;color:#334155;">${statusExplanation[data.status] ?? 'Your ticket status has been updated.'}</p>

    <p style="font-weight:600;margin:24px 0 8px 0;font-size:15px;">What Happens Next</p>
    <p style="margin:0 0 16px 0;line-height:1.7;color:#334155;">${nextSteps[data.status] ?? 'Please check the customer portal for the latest state of your ticket.'}</p>

    <p style="font-weight:600;margin:24px 0 8px 0;font-size:15px;">Track Your Ticket</p>
    <p style="margin:0 0 8px 0;">You can view the full progress timeline — including every status change with timestamps — in the customer portal under <strong>My Tickets</strong>.</p>

    <p style="margin:24px 0 0 0;color:#94a3b8;font-size:12px;">This is an automated notification from NexusDesk AI. Please do not reply to this email.</p>
  `;

  const result = await sendEmail({ to: data.recipient, subject, html });

  await logNotification({
    ticketId: data.ticketDbId ?? null,
    channel: 'Email',
    recipient: data.recipient,
    subject,
    body: `Status changed from ${data.previousStatus} to ${data.status}`,
    status: result.success ? 'Sent' : 'Failed',
    trigger: 'STATUS_CHANGE',
  });

  return result;
}
