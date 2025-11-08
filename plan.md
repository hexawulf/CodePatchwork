You are running as Claude Sonnet 4.5 via Droid in a local dev environment.

Repo path:
  /home/zk/p/CodePatchwork

Branches:
  - main  (clean, tracks origin/main)
  - wip/codepatchwork-local-edits-2025-11-08  (snapshot of previous local edits)

Do NOT merge or rebase the WIP branch into main.

Instead, your job is to:
1) Compare the two branches.
2) Understand what the WIP branch tried to improve (features, UX, bugfixes, performance, config).
3) Select only the parts that are still desirable.
4) Re-implement those improvements cleanly on top of the latest main branch as a small series of commits / patches.

Priorities:
- Performance and responsiveness of CodePatchwork.
- Security and correctness.
- UX quality and polish.
- Simplicity of diffs, easy review, and clean commit history.

Environment constraints:
- Runs on a Raspberry Pi ARM64 homelab behind Cloudflare + Nginx.
- Avoid adding native-heavy dependencies (sharp, node-canvas, native bcrypt, bundled Chromium, etc.).
- Prefer pure JS/TS and configuration changes over new libraries.

────────────────────────
Workflow & Tools
────────────────────────

You have typical Droid tools: Bash, ReadFile, WriteFile / ApplyDiff, etc.

Preferred style:
- Use Bash and Git to inspect the repo and diffs.
- Use ReadFile for targeted code reading, not random grepping everywhere.
- Use ApplyDiff (unified diffs) to implement changes.
- Keep everything on top of main. The WIP branch is read-only context.

Start with these commands:

Bash
cd /home/zk/p/CodePatchwork
git status -sb
git branch -vv
git fetch origin
git diff --stat origin/main...origin/wip/codepatchwork-local-edits-2025-11-08

Then inspect key files that changed between the two branches (frontend components, contexts, server, schema, configs).

────────────────────────
Update Todos (you maintain this list)
────────────────────────
- [ ] Confirm stack and repo layout from package.json, vite.config.ts, tsconfig.json, server/*, shared/schema.ts
- [ ] Generate a diff overview between main and wip/codepatchwork-local-edits-2025-11-08
- [ ] Classify WIP changes (perf, UX, security, DX, cosmetic, experimental)
- [ ] Decide which WIP changes to KEEP and which to DROP, with short justifications
- [ ] Design a small sequence of patches on top of main (2–6 commits)
- [ ] Implement patches via ApplyDiff on main (one patch at a time)
- [ ] Ensure the repo builds and basic flows work (build + minimal smoke tests)
- [ ] Summarize the final state and remaining WIP-only ideas (if any)

────────────────────────
What to keep / what to drop
────────────────────────

KEEP:
- Changes that clearly improve UX (better errors, clearer headers, nicer tags, safer defaults).
- Performance improvements (less re-rendering, better memoization, better sorting / filtering logic).
- Security / correctness fixes (better schema typing, safer DB access, safer auth).
- Reasonable config cleanup (tsconfig, vite config, ecosystem.config, etc.) that doesn’t break existing flows.

DROP or rework:
- Large structural experiments that are unfinished or brittle.
- Any regressions or half-broken features.
- Noisy cosmetic-only changes if they add complexity.
- Anything that clearly conflicts with new work already on main.

If in doubt, err on the side of:
- keeping main’s behaviour,
- and only adopting WIP changes that are clearly safe and helpful.

────────────────────────
Outputs you must produce
────────────────────────

In THIS run, do the following end-to-end, with minimal questions:

1) Diff Recon (short markdown section)
   - List which files differ between origin/main and origin/wip/codepatchwork-local-edits-2025-11-08.
   - For the most important files, briefly describe what the WIP branch tried to change.
   - Classify each important change: [perf] [UX] [security] [DX] [cosmetic] [experimental].

2) Adoption Plan
   - Bullet list of WIP changes you will port to main.
   - For each item: which file(s), why it’s worth keeping, and any cleanups or simplifications you’ll apply.

3) Patch Sequence on main
   - Switch to main, ensure it’s clean, and apply patches on top.
   - For each patch:
     - Short title and intent (e.g. “Improve snippet error page”, “Refine header layout”, “Auth context cleanup”).
     - ApplyDiff with a unified diff that can be applied to main.
     - Keep patches small and logically focused.
   - After all patches, ensure:
     - TypeScript still compiles.
     - The app builds.
     - Basic smoke (e.g. npm test / npm run lint or equivalent) passes if present.

4) Final Summary
   - List the new commits you added on main (with their titles).
   - Summarize what benefits were kept from the WIP branch.
   - Note any WIP-only ideas you intentionally did NOT port and why.
   - Mention any TODOs or follow-ups you recommend (e.g. “future perf pass on SnippetGrid”, “future security tightening here”, etc.).

────────────────────────
Important behaviour
────────────────────────

- Never merge or rebase WIP into main.
- Never delete the WIP branch; treat it as an archive.
- Keep diffs minimal and easy to review.
- If you need to introduce a new dependency, justify it and ensure it’s ARM-safe and lightweight.
- Default to text and diffs; only run commands that are necessary (no long-running benchmarks by default).

Act now on this plan: inspect the diffs, design the adoption plan, implement the patches on main, and then print the summary and the final `git log --oneline -5` so I can see what you did.

