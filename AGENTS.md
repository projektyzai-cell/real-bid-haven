# Architecture rules

- Raw bids are readable only by the bidder, property owner, and admins; public winner badges use the aggregate get_user_stars RPC so badge rendering does not disclose individual bids.
- Matching configuration is admin-readable and trust-score configuration is staff-readable; computation uses privileged backend paths rather than granting every signed-in user access to internal configuration.

- Record blog visits through the public blog server function, then read the persisted counter; the browser must not directly write counters, so all hosts use the same database path and errors are checked.
- Deduplicate effect replays for the currently displayed article, not across separate visits; counters represent page visits rather than unique visitors.
- City SEO landing pages live under /najem/miasto/$city (not /najem/$city, which would conflict with the static /najem/oferty segment); city data, images and SEO copy are centralized in src/lib/cities.ts.
- The city page catalog derives from the dropdown city dictionary through city-catalog.ts; retain explicit SEO copy for existing cities and use neutral residential imagery for cities without their own photograph to avoid misrepresenting landmarks.