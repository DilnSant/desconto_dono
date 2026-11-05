---
name: abrir
description: Use when starting or reopening work in the Desconto do Dono repository and needing a current project map, Git state, recent changes, or remaining launch tasks.
---

# Abrir projeto

Orient the user to the current state of this repository so work can resume with accurate context. This is a read-only review unless the user separately asks to implement a pending item.

## Review

1. Read `AGENTS.md`, `README.md`, and `docs/PENDENCIAS-PARA-LANCAMENTO.md` when present. Follow their project instructions and note any untracked or outdated documentation.
2. Capture `git status --short --branch`, the current branch, HEAD, upstream divergence, and recent commits. Do not assume the configured upstream is `origin/main`.
3. Map the repository with `rg --files -g '!node_modules'`, then inspect relevant entry points and module boundaries under `src/app`, `src/components`, `src/lib`, `src/types`, `supabase`, `tests`, and `docs`.
4. Read specs/plans updated in the last 48 hours first, then older design decisions that govern active behavior. Compare claimed completion with implementation and test evidence; an unchecked plan item is not automatically an unfinished code task.
5. Check package scripts and the latest available verification evidence. Run validation only when the user asks to test or when it is necessary for a requested change.
6. Treat external state (Vercel, Supabase, Asaas, Resend, production deployment) as unverified unless current tool or runtime evidence confirms it. Never print, copy, commit, or include secret values. Report only whether a required variable appears configured when relevant.

## Report

Give a concise Portuguese handoff with:

- project purpose, stack, and main module locations;
- branch, working-tree changes, HEAD, and divergence from the relevant remote;
- recent implemented decisions and their evidence;
- open tasks, separating code work from external setup and marking uncertainty;
- next actionable task, if the pending list and evidence identify one.

Keep existing user changes intact. Do not silently edit the pending list, change branches, commit, push, deploy, apply migrations, or create real payments during orientation.
