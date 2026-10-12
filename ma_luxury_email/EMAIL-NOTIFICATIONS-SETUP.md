# MA Luxury Guest Email Notifications

## Flow
Guest booking → Supabase `reservations` INSERT → Supabase Database Webhook → `booking-email` Edge Function → Resend → guest email.

No React/Vite code change is required for the first version because the current MA Luxury app already inserts guest reservations into `public.reservations`.

## 1. Resend
Create a Resend account, create an API key, and verify the domain you want to send from. For production use a sender such as `reservations@yourdomain.com`.

## 2. Edge Function
Put `index.ts` at:

```text
supabase/functions/booking-email/index.ts
```

Deploy from the project root:

```bash
supabase functions deploy booking-email --no-verify-jwt
```

## 3. Edge Function secrets
In Supabase Dashboard → Edge Functions → Secrets, add:

```text
RESEND_API_KEY=your_real_resend_api_key
RESEND_FROM_EMAIL=MA Luxury Apartments <reservations@yourdomain.com>
RESEND_REPLY_TO_EMAIL=your_business_email@yourdomain.com
```

`RESEND_REPLY_TO_EMAIL` is optional. Never put `RESEND_API_KEY` in the React app, `.env.local`, or GitHub.

## 4. Database Webhook
In Supabase Dashboard → Database → Webhooks, create:

- Name: `reservation_guest_email`
- Table: `public.reservations`
- Event: `INSERT`
- Method: `POST`
- Target: Supabase Edge Function
- Function: `booking-email`
- Content-Type: `application/json`

For HTTP authentication, use the dashboard option to add an auth header with a Supabase secret key. Do not hardcode a secret key in source code or SQL.

## 5. Test
Create one real test reservation using an email address you control. Verify the row appears in `public.reservations`, the webhook succeeds, the Edge Function log succeeds, and Resend shows the message as delivered.

The email includes guest name, booking ID, apartment, check-in, check-out, nights, guests, status, and guest notes when supplied.

If status is `Confirmed`, the email says the reservation is confirmed. If status is `Pending`, it says the reservation request was received.

## Security
- `RESEND_API_KEY` belongs only in Supabase Edge Function Secrets.
- Never put a Supabase secret/service-role key in the Vite frontend.
- Keep `.env.local` ignored by Git.
- Use the Database Webhook's secret-key authentication rather than placing a secret in the repository.
