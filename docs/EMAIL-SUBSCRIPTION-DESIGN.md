# Public Email Subscription Design — Not Enabled

Status: design only; no public subscription endpoints are included in version 0.1.1.

## Principles

- Explicit opt-in only; never scrape, buy, or infer email addresses.
- Double opt-in before the first recurring message.
- One-click unsubscribe in every email.
- A suppression list prevents accidental resubscription after unsubscribe.
- Subscriber addresses are never committed to Git, included in logs, or exposed through MCP tools.
- SMTP credentials remain server-side secrets and are never accepted from a public user.

## Proposed flow

1. User submits an email and selects the digest type.
2. Server stores a pending record with a random, single-use confirmation token and expiry.
3. Confirmation email explains frequency, sender, privacy notice, and cancellation.
4. User confirms; status changes to active and consent timestamp/source are recorded.
5. Every digest includes an opaque unsubscribe URL.
6. Unsubscribe changes status to suppressed immediately and does not require login.

## Minimum data model

- Normalized email address, encrypted at rest where feasible.
- Status: pending, active, or suppressed.
- Requested digest categories.
- Consent and confirmation timestamps.
- Confirmation and unsubscribe token hashes, never plaintext tokens.
- Last delivery status and bounce count.

Do not store IP addresses with the subscription record unless required for abuse prevention or legal compliance. Do not use subscriber data for advertising profiles.

## Security requirements before implementation

- Separate mail credential from the operator's interactive mailbox when practical.
- SPF, DKIM, and DMARC for the sending domain.
- Rate limits on subscribe, confirm, and unsubscribe endpoints.
- Constant-time token comparison and short-lived confirmation tokens.
- CSRF protection where browser state is used.
- Bounce and complaint handling.
- Export/delete request procedure.
- Provider terms and applicable anti-spam review.

## Existing private automation

The operator's existing private QQ SMTP workflow is outside this public plugin package. Its authorization code must remain in local encrypted storage and must not be copied into this repository or a public server image.
