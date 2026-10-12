import { withSupabase } from "npm:@supabase/server@^1";
import { Resend } from "npm:resend@^6";

type BookingRecord = { id?: string; guest_name?: string; email?: string; apartment?: string; checkin?: string; checkout?: string; nights?: number; guests?: number; status?: string; notes?: string };
type WebhookPayload = { type?: string; table?: string; schema?: string; record?: BookingRecord | null };

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");
const from = Deno.env.get("RESEND_FROM_EMAIL") ?? "MA Luxury Apartments <onboarding@resend.dev>";
const replyTo = Deno.env.get("RESEND_REPLY_TO_EMAIL") ?? "";

const escapeHtml = (value: unknown) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const prettyDate = (value?: string) => { if (!value) return "—"; const d = new Date(`${value}T00:00:00`); return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" }).format(d); };
const dash = (value: unknown) => value === undefined || value === null || value === "" ? "—" : String(value);

function buildEmail(record: BookingRecord) {
  const confirmed = String(record.status || "Pending") === "Confirmed";
  const subject = confirmed ? `MA Luxury Apartments | Reservation ${record.id ?? "received"}` : `MA Luxury Apartments | Reservation request ${record.id ?? "received"}`;
  const heading = confirmed ? "Your reservation is confirmed." : "We received your reservation request.";
  const status = String(record.status || "Pending");
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f3f0ea;color:#20201d;font-family:Arial,Helvetica,sans-serif"><div style="max-width:680px;margin:0 auto;padding:32px 18px"><div style="background:#171713;color:#f8f5ee;border-radius:20px 20px 0 0;padding:30px 32px"><div style="font-size:11px;letter-spacing:3px;color:#c7a45a;font-weight:700">MA LUXURY</div><div style="font-size:13px;letter-spacing:1px;margin-top:7px;color:#d8d3c8">APARTMENTS</div></div><div style="background:#fffdf9;padding:36px 32px;border:1px solid #e4ded3;border-top:0"><div style="display:inline-block;padding:7px 10px;border:1px solid #c7a45a;color:#8a6b2d;font-size:10px;letter-spacing:1.5px;font-weight:700;border-radius:999px">${escapeHtml(status.toUpperCase())}</div><h1 style="font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;font-weight:500;margin:22px 0 12px;color:#1c1b18">${heading}</h1><p style="font-size:16px;line-height:1.7;color:#555148;margin:0 0 28px">Hello ${escapeHtml(record.guest_name || "Guest")}, thank you for choosing MA Luxury Apartments. Here are the details attached to your reservation.</p><div style="border:1px solid #e5dfd4;border-radius:14px;overflow:hidden"><div style="padding:16px 18px;background:#f7f3eb;font-size:11px;letter-spacing:1.4px;color:#756b5d;font-weight:700">RESERVATION DETAILS</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse"><tr><td style="padding:13px 18px;color:#817a6f;font-size:13px;width:42%">Booking ID</td><td style="padding:13px 18px;font-weight:700;font-size:13px">${escapeHtml(record.id || "—")}</td></tr><tr><td style="padding:13px 18px;color:#817a6f;font-size:13px">Apartment</td><td style="padding:13px 18px;font-weight:700;font-size:13px">${escapeHtml(record.apartment || "—")}</td></tr><tr><td style="padding:13px 18px;color:#817a6f;font-size:13px">Check-in</td><td style="padding:13px 18px;font-size:13px">${prettyDate(record.checkin)}</td></tr><tr><td style="padding:13px 18px;color:#817a6f;font-size:13px">Check-out</td><td style="padding:13px 18px;font-size:13px">${prettyDate(record.checkout)}</td></tr><tr><td style="padding:13px 18px;color:#817a6f;font-size:13px">Nights</td><td style="padding:13px 18px;font-size:13px">${dash(record.nights)}</td></tr><tr><td style="padding:13px 18px;color:#817a6f;font-size:13px">Guests</td><td style="padding:13px 18px;font-size:13px">${dash(record.guests)}</td></tr></table></div>${record.notes ? `<div style="margin-top:20px;padding:16px 18px;background:#faf7f0;border-left:3px solid #c7a45a;border-radius:8px"><div style="font-size:10px;letter-spacing:1.4px;color:#817a6f;font-weight:700;margin-bottom:7px">YOUR NOTE</div><div style="font-size:13px;line-height:1.6;color:#4e4a42">${escapeHtml(record.notes)}</div></div>` : ""}<p style="font-size:14px;line-height:1.7;color:#625d53;margin:28px 0 0">Please keep this email for your records. If you need to make a change or ask a question about your stay, reply to this email or contact MA Luxury Apartments directly.</p></div><div style="padding:22px 8px;text-align:center;color:#8b8478;font-size:11px;line-height:1.6">© ${new Date().getFullYear()} MA Luxury Apartments<br>Premium stays, thoughtfully hosted.</div></div></body></html>`;
  const text = ["MA LUXURY APARTMENTS", "", confirmed ? "Your reservation is confirmed." : "We received your reservation request.", `Hello ${record.guest_name || "Guest"},`, "", `Booking ID: ${record.id || "—"}`, `Apartment: ${record.apartment || "—"}`, `Check-in: ${prettyDate(record.checkin)}`, `Check-out: ${prettyDate(record.checkout)}`, `Nights: ${dash(record.nights)}`, `Guests: ${dash(record.guests)}`, `Status: ${status}`, record.notes ? `Note: ${record.notes}` : "", "", "Thank you for choosing MA Luxury Apartments."].filter(Boolean).join("\n");
  return { subject, html, text };
}

export default {
  fetch: withSupabase({ auth: "secret" }, async (req) => {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
    if (!Deno.env.get("RESEND_API_KEY")) return Response.json({ error: "Email provider is not configured." }, { status: 500 });
    const payload = await req.json().catch(() => null) as WebhookPayload | null;
    if (!payload || payload.type !== "INSERT" || payload.table !== "reservations" || payload.schema !== "public") return Response.json({ ignored: true });
    const record = payload.record;
    if (!record?.email || !record.id || !record.guest_name) return Response.json({ error: "Reservation payload is missing required email fields." }, { status: 422 });
    const email = String(record.email).trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: "Invalid guest email address." }, { status: 422 });
    const { subject, html, text } = buildEmail(record);
    const { data, error } = await resend.emails.send({ from, to: [email], subject, html, text, ...(replyTo ? { replyTo } : {}) });
    if (error) { console.error("Resend error:", error); return Response.json({ error: "Email provider rejected the message." }, { status: 502 }); }
    return Response.json({ ok: true, emailId: data?.id ?? null });
  }),
};
