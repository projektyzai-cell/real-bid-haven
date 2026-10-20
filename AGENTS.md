# Architecture rules

- Record blog visits through the public blog server function, then read the persisted counter; the browser must not directly write counters, so all hosts use the same database path and errors are checked.
- Deduplicate effect replays for the currently displayed article, not across separate visits; counters represent page visits rather than unique visitors.