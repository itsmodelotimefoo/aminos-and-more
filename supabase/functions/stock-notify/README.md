# stock-notify — auto back-in-stock emails

Emails customers on the waitlist (`stock_notify`) when the size they asked about
is back in stock (`size_stock.on_hand > 0`), then marks them `notified`. Runs on
a schedule so you never have to think about it. Idempotent: a signup is only
flipped to `notified` after its email actually sends, so failures self-retry.

Pairs with the Hub **Waitlist** view — anything this job clears disappears there
too (both read the same `notified` flag).

## Prerequisites

- `size_stock` and `stock_notify` tables exist (`db/schema.sql`).
- An email provider. This function uses **[Resend](https://resend.com)** (simple
  REST, generous free tier). Verify your sending domain in Resend so the
  `From` address can be `noreply@aminosandmore.com` (until then, use Resend's
  `onboarding@resend.dev` sandbox sender).

## 1. Set secrets

```bash
supabase secrets set \
  RESEND_API_KEY="re_xxxxxxxx" \
  NOTIFY_FROM="Aminos & More <noreply@aminosandmore.com>" \
  NOTIFY_CRON_SECRET="$(openssl rand -hex 16)"
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — don't
set them. Leave `RESEND_API_KEY` unset to **dry-run**: the function reports who
it *would* email (`wouldSend`) and flips nothing, so you can watch it first.

## 2. Deploy

```bash
supabase functions deploy stock-notify --no-verify-jwt
```

`--no-verify-jwt` lets pg_cron call it without a user JWT; `NOTIFY_CRON_SECRET`
is what actually protects it (callers must send the matching `x-cron-secret`).

## 3. Schedule it (every 15 min) with pg_cron

Run once in the SQL editor (needs the `pg_cron` + `pg_net` extensions, both
available on Supabase). Replace `<PROJECT_REF>` and `<NOTIFY_CRON_SECRET>`:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'stock-notify-every-15m',
  '*/15 * * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.functions.supabase.co/stock-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', '<NOTIFY_CRON_SECRET>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
```

To change the cadence, `select cron.unschedule('stock-notify-every-15m');` and
re-create. To pause, unschedule.

## 4. Test manually

```bash
curl -s -X POST 'https://<PROJECT_REF>.functions.supabase.co/stock-notify' \
  -H 'x-cron-secret: <NOTIFY_CRON_SECRET>' -H 'Content-Type: application/json' -d '{}'
```

Response shape:

```json
{ "ok": true, "checked": 3, "matched": 1, "sent": 1, "failed": [], "dryRun": false }
```

- `checked` — open signups scanned
- `matched` — signups whose size is back in stock
- `sent` — emails delivered (these got flipped to `notified`)
- `dryRun` — true when `RESEND_API_KEY` is unset (adds `wouldSend`, flips nothing)

## Notes

- **Per-brand From.** One `NOTIFY_FROM` is used for every brand. To send
  getWLL's waiters from a getWLL address, branch on the signup's `store_slug`
  (it's already queried) and pick a `From` per store.
- **Product link.** The email links to `https://{store.domain}/products/{slug}`
  using the `stores.domain` column, so each brand's email points at its own site.
- **Volume.** Sends one email per matching signup, sequentially — fine for this
  scale. For large bursts, switch to Resend's batch endpoint.
