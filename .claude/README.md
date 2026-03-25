# .claude/ — Claude Code Scaffold

## Relationship to CLAUDE.md

The root `CLAUDE.md` is the primary context file. It describes architecture, commands, build system, and guardrails. This `.claude/` directory provides complementary tooling:

- **settings.json** — pre-approved and denied commands so common operations don't need manual approval
- **skills/** — step-by-step workflows for repeated tasks that are easy to get wrong in this monorepo

`CLAUDE.md` = what the repo is and how it works.
`.claude/` = automation for working in it safely.

## What's Here

```
.claude/
├── settings.json              # Permissions + hook registration
├── README.md                  # This file
├── hooks/
│   └── protect-generated-files.sh  # Blocks edits to math-*/build/ and .papi/descriptors/
└── skills/
    ├── add-xc-route.md        # Add a cross-chain route in xc-cfg
    └── validate-change.md     # Build + test checklist for monorepo changes
```

## Extending

- **New skill?** Add a `.md` file in `skills/`. Keep it narrowly scoped to one workflow.
- **New permission?** Add to `settings.json` `allow` list. Only add safe, read-only or local-only commands.
- **Never allow** in settings: `npm publish`, `changeset publish`, `release`, or anything that pushes to remote.

## What Stays in CLAUDE.md

- Architecture and dependency graph
- Build system explanation
- "What NOT to break" guardrails
- Cross-package tracing guidance
- Key file reference table
