# Resend app email integration

## Context and intent

The Resend domain is configured and the Resend integration has added
`RESEND_API_KEY` to the Vercel project. Supabase Auth is connected to Resend
over SMTP. The Zoho mailbox `faleconosco@descontododono.com.br` exists and
continues to receive mail through the domain's Zoho MX records.

The application sends a transactional notification to the business responsible
for a newly captured lead. The former waitlist flow is retired; authentication
email delivery remains a separate Supabase dashboard configuration.

## Decisions

- Use the Resend Node.js SDK through a server-only helper in the existing
  Next.js application. Do not send from the browser or add a Supabase Edge
  Function.
- Use `faleconosco@descontododono.com.br` as the sender for app emails.
- Store the sender address in the Vercel environment variable
  `RESEND_FROM_EMAIL`. The existing Resend-Vercel integration supplies
  `RESEND_API_KEY`; it does not supply the sender address.
- Keep Supabase Auth SMTP settings in Supabase. The Vercel sender variable does
  not configure Auth.
- Send lead notifications only to the benefit owner's public
  `profiles.email_public`. Never use the private Auth account email or accept a
  recipient address from the browser.
- Do not send waitlist confirmations. New waitlist API requests return `410
  Gone`; existing records remain preserved.
- Do not add schema or RLS changes for this email integration.

## Architecture and data flow

### Shared email sender

Add a server-only email helper that initializes Resend from `RESEND_API_KEY`
and reads `RESEND_FROM_EMAIL` at send time. It must not be imported by client
components. Missing configuration and provider errors are reported as failed
delivery results and logged without credentials or submitted personal data.

The helper sends typed lead-notification messages. Use stable idempotency keys
derived from the lead database row ID so retries do not intentionally send
duplicate messages.

### Retired waitlist

The public waitlist form and its confirmation email are no longer used.
`GET /api/waitlist` and `POST /api/waitlist` return `410 Gone`, and no new
records are inserted. Existing rows are retained; their table has no public
insert or read policy.

### Lead notification

Move lead creation from the browser's direct Supabase insert to a Next.js
server route. The route validates the name, WhatsApp number, and benefit ID;
loads the active benefit and its owner's public profile email from Supabase;
then persists the lead. It uses only the database-derived `email_public` as the
recipient.

If the benefit is invalid or inactive, reject the request without creating a
lead. If the owner has no public email, persist the lead but skip email
delivery. If sending fails after persistence, keep the lead and return a
response that distinguishes saved lead from failed notification. Update the
lead modal so it never claims that an email notification was delivered when it
was not.

The route must use the existing server-side Supabase client and current RLS
model; it must not use a service-role key. Existing anonymous lead capture must
continue to work.

## Configuration and operations

Before deploying the app changes:

1. In Vercel, add `RESEND_FROM_EMAIL` with value
   `faleconosco@descontododono.com.br` to the environments that will run the
   app, then redeploy.
2. Keep `RESEND_API_KEY` server-only and do not expose it under a
   `NEXT_PUBLIC_` name.
3. Keep the Supabase Auth sender and SMTP credentials configured in the
   Supabase Auth SMTP settings. Do not change Zoho MX records as part of this
   work.

The Resend sender domain must remain verified before production sends are
enabled.

## Error handling and privacy

- A lead insert failure remains a failed lead capture; a notification failure
  after insertion does not.
- Return explicit delivery status to the UI for post-insert email failures.
- Do not log email addresses, names, WhatsApp numbers, API keys, or email
  contents.
- Use a notification status that differentiates a missing public recipient
  from provider/configuration failure.
- Do not silently report successful delivery when no message was sent.

## Testing and acceptance criteria

Automated tests, using a mocked Resend client and Supabase dependencies, must
verify:

1. A lead request derives its recipient from the benefit owner's
   `email_public`, persists the lead, and sends one notification.
2. A missing `email_public` persists the lead and skips delivery.
3. Invalid/inactive benefits and invalid lead payloads do not create a lead or
   send email.
4. A lead email failure does not undo the lead and is accurately reflected in
   the modal.
5. Email helpers and credentials are only referenced from server code.
6. Both waitlist API methods return `410 Gone` without inserting or reading
   waitlist rows.

After deployment, manually verify password recovery through Supabase Auth,
a lead notification for a business with a public email, and lead capture for a
business without one. The database record must remain available in both lead
cases.

## Out of scope

- Creating or administering the Zoho mailbox.
- Changing DNS, MX, SPF, or DKIM records.
- Configuring or changing Supabase Auth SMTP through application code.
- Sending lead notices to the platform's central mailbox or to the private
  account email.
- Marketing campaigns, bulk mail, attachments, or unsubscribe management.
- Sending waitlist confirmation emails or accepting new waitlist registrations.
