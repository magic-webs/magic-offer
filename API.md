# Spin Wheel API

Base URL: `https://win.magicwebs.ai`

These are the public endpoints an external system (CRM, WhatsApp/SMS bot, etc.)
can call. Everything else in the app talks to InstantDB only through these
routes — there is no direct database access from outside.

**Multiple companies:** the routes below are for the original/default wheel
and never change shape. Every additional company created from `/admin` gets
its own wheel at `https://win.magicwebs.ai/w/{slug}` with its own
`POST /api/w/{slug}/register` and `GET /api/w/{slug}/settings`, mirroring
`/api/register` and `/api/settings` below. `/api/session` and `/api/spin` are
shared automatically by every company — a spin link already knows which
company it belongs to, so there's no per-company version of those two.

## Get a spin link

```
POST /api/register
Content-Type: application/json
```

Registers a person (or looks up an existing one by phone) and returns their
personal spin link.

**Body**

```json
{ "name": "Jane Doe", "phone": "+1 555 0100" }
```

Both fields are optional server-side, but which ones are actually *required*
depends on the live admin settings (`/admin` → Popup fields):

- If **"Ask for name"** is on, `name` is required.
- If **"Ask for phone number"** is on, `phone` is required and must match
  `^[0-9+][0-9\s-]{6,14}$`.
- Calling this repeatedly with the **same phone number** always returns the
  same token/link — it's safe to retry.

**Response — 200**

```json
{
  "token": "oGqD8947dcdS",
  "loginUrl": "https://win.magicwebs.ai/?t=oGqD8947dcdS"
}
```

`loginUrl` is the link to send the person (SMS, WhatsApp, email). Opening it:

- Skips the name/phone popup entirely.
- Shows the wheel ready to spin if they haven't used their spin yet.
- Shows their prize directly if they already have.

**Response — 400** (`invalid_input`) — missing/invalid name or phone per the
current settings. **Response — 500** (`server_error`) — transient failure,
safe to retry.

## Check a link's status

```
GET /api/session?token=<token>
```

Resolves a token back to who it belongs to, without spinning anything.

**Response — 200**

```json
{
  "name": "Jane Doe",
  "hasSpun": false,
  "prizeId": null,
  "prizeLabel": null
}
```

`prizeId` is one of `perfume_1`, `perfume_2`, `perfume_3`, `no_win` once
`hasSpun` is `true`. **Response — 404** if the token doesn't exist.

## Spin

```
POST /api/spin
Content-Type: application/json
```

**Body**

```json
{ "token": "oGqD8947dcdS" }
```

Draws a weighted prize the first time it's called for a token; every call
after that returns the same result instead of drawing again.

**Response — 200**

```json
{ "alreadySpun": false, "prizeId": "perfume_1", "prizeLabel": "Get 1 Free Perfume" }
```

**Response — 404** if the token doesn't exist.

## Popup field configuration

```
GET /api/settings
```

Read-only, public. Returns what the registration popup is currently asking
for — set from `/admin`.

```json
{ "askName": true, "askPhone": true }
```

## Website embed loader

```
GET /embed.js
```

The script a merchant pastes onto their own site. Serves plain JavaScript
with `Access-Control-Allow-Origin: *`; configuration comes from the two
`data-` attributes on the tag itself.

```html
<script async src="https://win.magicwebs.ai/embed.js"
  data-magic-offer="{slug}"
  data-offer-id="{offerId}"></script>
```

`data-offer-id` is optional — without it the loader uses the company's
newest active offer, the same rule `/w/{slug}` follows.

Once loaded it exposes `window.MagicOffer` with `open()`, `close()`,
`reset()` (clears frequency capping) and `config()`, and fires
`magicoffer:open`, `magicoffer:close` and `magicoffer:registered` on
`window`.

`/embed-preview?slug={slug}&o={offerId}` is a sample storefront that loads
this same script with frequency capping disabled, for testing triggers.

## Embed configuration

```
GET /api/w/{slug}/embed-config?o={offerId}
```

Read-only, public, CORS-open. What `/embed.js` calls on load. Returns
`{ "enabled": false, ... }` — with no `offer` — whenever the company, the
offer or the embed itself is switched off, so the loader stays silent.

```json
{
  "enabled": true,
  "config": {
    "triggers": { "exitIntent": true, "exitSensitivity": 20, "mobileScrollUp": true, "...": "..." },
    "frequency": "session",
    "armAfterSeconds": 3,
    "showFomo": true,
    "launcher": { "enabled": false, "text": "🎁 Win a prize", "...": "..." },
    "modal": { "width": 460, "height": 640, "...": "..." },
    "allowedDomains": []
  },
  "offer": {
    "id": "...",
    "title": "Summer Giveaway",
    "companyName": "Acme",
    "url": "https://win.magicwebs.ai/w/acme?o=...&embed=1",
    "fomoUrl": "https://win.magicwebs.ai/api/w/acme/fomo?o=..."
  }
}
```

## FOMO notification feed

```
GET /api/w/{slug}/fomo?o={offerId}
```

Read-only, public, CORS-open, cached 30s. The social-proof notifications
configured on the offer's FOMO tab, already rendered to display text.

```json
{
  "enabled": true,
  "position": "bottom-left",
  "theme": "auto",
  "displayMs": 5000,
  "gapMs": 7000,
  "initialDelayMs": 4000,
  "loop": true,
  "showOnMobile": true,
  "items": [
    { "id": "winner-...", "type": "recent_winner", "icon": "🏆", "text": "Priya S. just won 20% OFF — 4 minutes ago" },
    { "id": "countdown", "type": "countdown", "icon": "⏳", "text": "Hurry — this offer ends in", "countdownEndsAt": 1788157538455, "template": "Hurry — this offer ends in {time}" }
  ]
}
```

Types `recent_winner`, `recent_signup`, `signup_count` and `low_stock` are
built from real `spins` rows for the offer; `live_visitors` and `custom` are
generated from what the merchant configured. `countdown` items carry
`countdownEndsAt` and `template` so the client can tick them without
re-fetching. Names are shortened to `First L.` unless the merchant turns
that off. `enabled: false` with an empty `items` array is the answer for
anything not switched on.

## Notes

- `NEXT_PUBLIC_SITE_URL` (currently `https://win.magicwebs.ai`) controls the
  domain baked into `loginUrl`. Update it in `.env` if the app ever moves.
- There's no API key on these routes — they're the same ones the public
  wheel page uses. Don't put anything sensitive behind them beyond what's
  documented here.
