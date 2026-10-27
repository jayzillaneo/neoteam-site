# NEO public site hosting

## Local source
- `/workspace/neo-site/index.html` — home
- `/workspace/neo-site/privacy.html` — privacy policy
- `/workspace/neo-site/download.html` — Google sign-in + Mac/Windows downloads
- `/workspace/neo-site/app/index.html` — web app entry (placeholder until deployed)
- `/workspace/neo-site/site-config.js` — public Supabase URL + anon key
- `/workspace/neo-site/CNAME` — `neoteam.app`
- Edge Function source: `supabase/functions/download-build/`

## Live hosting
Public GitHub Pages repo: https://github.com/jayzillaneo/neoteam-site  
(Private `jayzillaneo/neo-app` cannot enable Pages on the free plan.)

Custom domain in Pages settings: `neoteam.app`  
Default Pages URL: https://jayzillaneo.github.io/neoteam-site/

## Downloads
- Private Supabase Storage bucket: `neo-builds`
- Objects:
  - `latest/mac/NEO_universal.dmg`
  - `latest/windows/NEO_x64-setup.exe`
- Edge Function: `download-build` (checks company email domain server-side, returns 120s signed URL)

Allowed domains: cartelpr.com, sharks.agency, gray.com.pk, jbnjaws.com, jahanz.com

## Web app
`jayzillaneo/neo-app` has a static export target (`npm run build:desktop` → `out/`) and an old temporary Cloudflare tunnel URL in README. No permanent public web deployment exists yet. `/app/` on this site is a placeholder until one is hosted (ideally `app.neoteam.app` or `/app`).

## DNS to set at Porkbun (neoteam.app)
Do this in the Porkbun DNS panel. Keep Porkbun nameservers. Do not change nameservers.

### Apex (required)
| Type | Host | Answer              | TTL  |
|------|------|---------------------|------|
| A    | @    | 185.199.108.153     | 600  |
| A    | @    | 185.199.109.153     | 600  |
| A    | @    | 185.199.110.153     | 600  |
| A    | @    | 185.199.111.153     | 600  |

Optional IPv6 AAAA, Host `@`:
| Type | Host | Answer              |
|------|------|---------------------|
| AAAA | @    | 2606:50c0:8000::153 |
| AAAA | @    | 2606:50c0:8001::153 |
| AAAA | @    | 2606:50c0:8002::153 |
| AAAA | @    | 2606:50c0:8003::153 |

### www (recommended)
| Type  | Host | Answer                |
|-------|------|-----------------------|
| CNAME | www  | jayzillaneo.github.io |

Remove any Porkbun parking / default A or ALIAS records that conflict.

## Supabase Auth redirect URLs to add
Project `tepsmlljgbxgdhodgfpc`:
- `https://neoteam.app/download.html`
- `https://jayzillaneo.github.io/neoteam-site/download.html` (fallback before DNS)
- Site URL can stay as the app deep link; add the above under Additional Redirect URLs.

Google Cloud OAuth client for the same project should also allow those origins/redirects if the consent screen requires them.

## After DNS propagates
1. Confirm https://neoteam.app/ , /privacy.html , /download.html load.
2. GitHub → neoteam-site → Settings → Pages → **Enforce HTTPS**.
3. Google Cloud project `neo-app-512813` consent screen branding:
   - Application home page: `https://neoteam.app`
   - Privacy policy: `https://neoteam.app/privacy.html`
