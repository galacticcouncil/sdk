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
    ├── add-xc-route.md            # Add a cross-chain route in xc-cfg
    ├── query-router.md            # Run router queries (spot price, routes, trades) inline via tsx
    └── validate-change.md         # Build + test checklist for monorepo changes
```

## Example Prompts

### query-router

```
Query the spot price between DOT (5) and HDX (0) on Lark
```
```
Get the most liquid route from HDX (0) to USDT (10)
```
```
Get best sell for 100 DOT (5) to USDT (10) on Chopsticks
```

### validate-change

```
I changed packages/common/src/utils/big.ts — validate it builds and tests pass
```

### add-xc-route

```
Add a cross-chain route for USDT from Ethereum to Hydration via Moonbeam
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
