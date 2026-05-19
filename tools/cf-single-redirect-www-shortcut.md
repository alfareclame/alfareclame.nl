# Cloudflare Single Redirect — kill 2-hop www→apex→/ chain

**Problem (Ahrefs audit 2026-05-19):** 3 URLs do a 2-hop redirect chain:

```
https://www.alfareclame.nl/author/alfaadmin/      -> https://alfareclame.nl/author/alfaadmin/      -> https://alfareclame.nl/
https://www.alfareclame.nl/drukkerij-rotterdam/   -> https://alfareclame.nl/drukkerij-rotterdam/   -> https://alfareclame.nl/
https://www.alfareclame.nl/meta-keys/             -> https://alfareclame.nl/meta-keys/             -> https://alfareclame.nl/
```

The 1st hop is the generic Cloudflare zone `www.* -> apex/*` rule. The 2nd hop is our Pages `_redirects` file. Cannot be solved inside `_redirects` (path-only matching, no host source).

## Fix — Cloudflare Dashboard -> Rules -> Redirect Rules

Create a Single Redirect Rule ABOVE the generic www->apex rule:

- Name: `www legacy paths -> apex root direct`
- Expression: `(http.host eq "www.alfareclame.nl" and (starts_with(http.request.uri.path, "/author/") or starts_with(http.request.uri.path, "/drukkerij-rotterdam") or starts_with(http.request.uri.path, "/meta-keys")))`
- Then: Static redirect -> `https://alfareclame.nl/`
- Status: 301
- Preserve query string: false

Place this rule first in the Redirect Rules list. The generic www->apex rule stays as fallback.

## Verification

```bash
curl -sI https://www.alfareclame.nl/author/alfaadmin/   | grep -i 'location\|status'
curl -sI https://www.alfareclame.nl/drukkerij-rotterdam/ | grep -i 'location\|status'
curl -sI https://www.alfareclame.nl/meta-keys/           | grep -i 'location\|status'
```

Expected: `HTTP/2 301` + `location: https://alfareclame.nl/` (no intermediate apex URL).
