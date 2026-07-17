# Deploy process notes — `supabase/functions/api`

## What was checked

- **Supabase CLI**: not installed (`which supabase` empty), but `npx --yes supabase
  --version` works (2.109.1) — network access to npm registry is fine. However it is
  **not authenticated**: `npx supabase projects list` returns
  `LegacyPlatformAuthRequiredError`. No `SUPABASE_ACCESS_TOKEN` env var exists, and
  `~/.supabase/` (root's home, since this session runs as root) only has
  `telemetry.json`/`traces`, no `access-token` file. So `supabase functions deploy`
  from disk is not usable today — it would need a personal access token that isn't
  present anywhere I can find, and I did not attempt to extract one from the Supabase
  MCP server's own internal config (that's a separate credential boundary, not
  something to repurpose).
- **Direct Management API via curl**: same problem — no management token in env or in
  any config file under `/root` or the repo. The only Supabase-related credential in
  play is whatever the `mcp__Supabase__*` tools use internally, which isn't exposed to
  the shell.
- **File size**: the 18 files (9 in `api/`, 9 in `api/actions/`) total **4643 lines**.
  Note CLAUDE.md's checklist says "17 archivos" — it's off by one (drifted after a file
  was added); worth a one-line fix next time someone's in there, not urgent.

## Recommendation, in priority order

1. **No credential-based shortcut exists right now.** Until a `SUPABASE_ACCESS_TOKEN`
   is deliberately provisioned into this environment (a decision for you, not
   something to improvise), `mcp__Supabase__deploy_edge_function` is the only path.
2. **Always delegate the deploy call itself to one fresh, single-purpose background
   agent**, separate from whatever agent did the code edit/exploration. Prompt it to:
   read all 18 files fresh via `Read` (never reconstruct from memory), then call
   `deploy_edge_function` exactly once with no intermediate retries. This isolates the
   large output to a turn with its own full per-response budget — this part of the
   pattern worked.
3. **Launch that deploy agent early**, not at the tail end of a long session. The
   background agent shares the *session-wide* usage cap with the main conversation —
   it does not get a separate quota. If the session is already near its cap from prior
   exploration/edits, the deploy will fail the same way regardless of delegation. If a
   session is deploy-heavy, do the deploy first or in a fresh session.
4. **Don't restructure the file layout to fewer/bigger files.** Total content (~4643
   lines) is dictated by actual logic, not file count; merging files saves only
   boilerplate (imports/headers), a small fraction. It would also undo the deliberate
   single-responsibility split documented in `index.ts`'s own header comment. Not worth
   the trade for a purely mechanical problem.
