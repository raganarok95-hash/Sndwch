# Deploy process notes — `supabase/functions/api`

## The actual answer (found after this doc's first draft was wrong)

**Deploy of `api` is already automated. Merging to `main` is enough — do not call
`mcp__Supabase__deploy_edge_function` for `api` at all under normal circumstances.**

`.github/workflows/deploy-api.yml` runs on every push to `main` that touches
`supabase/functions/**`, and does:

```
supabase functions deploy api --project-ref rjosezuoyngiadunfzyn --no-verify-jwt
```

authenticated via a `SUPABASE_ACCESS_TOKEN` repo secret (already configured — confirmed
working, not hypothetical). It also redeploys `create-charge`, `create-credit-charge`,
and `weekly-summary` the same way. Confirmed empirically: the "POLLO CAJÚN exclusiva de
THE VAULT" fix merged to `main` at commit `dae81cc`, and workflow run `29561193577`
(triggered by that exact push) completed successfully a few minutes later; the live
`api` function (checked via `mcp__Supabase__get_edge_function`) contained the fix,
version bumped normally. No manual MCP deploy call was needed or made.

**So the correct sequence for any `supabase/functions/api/**` change is just the
standard ship ritual** (typecheck → build → test → commit → push branch → merge
`--no-ff` to `main` → push `main`) — CI takes it from there. Confirm success afterward
with `mcp__github__actions_list` (`list_workflow_runs`, resource_id
`deploy-api.yml`) and/or `mcp__Supabase__get_edge_function` if you want certainty, but
don't block on it and don't hand-assemble the 18-file payload preemptively.

## When the manual `deploy_edge_function` MCP path is still needed

Only if: (a) the GitHub Actions workflow itself is broken/misconfigured, (b) the
`SUPABASE_ACCESS_TOKEN` secret is revoked/expired, or (c) you need a change live
*before* it can be merged to `main` (rare, and worth asking the user first since it
bypasses the normal review-then-merge flow). In that situation, the file-completeness
problem below still applies.

## Original investigation (kept for context — the credential-shortage framing below

was true but beside the point, since the missing piece was never "a token this session
can use directly," it was "check whether CI already has one")

- **Supabase CLI**: not installed (`which supabase` empty), but `npx --yes supabase
  --version` works (2.109.1). **Not authenticated in this session**:
  `npx supabase projects list` returns `LegacyPlatformAuthRequiredError`; no
  `SUPABASE_ACCESS_TOKEN` in this session's env, no `~/.supabase/access-token`. This is
  irrelevant for `api`/`create-charge`/`create-credit-charge`/`weekly-summary` — CI has
  its own token — but would still block direct CLI deploy of any *other* edge function
  not covered by `deploy-api.yml`.
- **File size**: the 18 files (9 in `api/`, 9 in `api/actions/`) total **4643 lines**.
  Note CLAUDE.md's checklist says "17 archivos" — it's off by one (drifted after a file
  was added); worth a one-line fix next time someone's in there, not urgent.

## If the manual MCP path is genuinely needed

1. **Always delegate the deploy call itself to one fresh, single-purpose background
   agent**, separate from whatever agent did the code edit/exploration. Prompt it to:
   read all 18 files fresh via `Read` (never reconstruct from memory), then call
   `deploy_edge_function` exactly once with no intermediate retries.
2. **Launch that deploy agent early**, not at the tail end of a long session — it
   shares the *session-wide* usage cap with the main conversation, not a separate one.
3. **Don't restructure the file layout to fewer/bigger files.** Total content (~4643
   lines) is dictated by actual logic, not file count.
4. Before trusting a "success" report from a delegated deploy, verify independently
   (`mcp__Supabase__list_edge_functions` version bump, or `get_edge_function` content
   diff) — a delegated agent's summary is not proof.
