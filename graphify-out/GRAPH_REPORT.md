# Graph Report - Nexar  (2026-09-09)

## Corpus Check
- 78 files · ~52,596 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 582 nodes · 635 edges · 49 communities (36 shown, 11 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7bd892c7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- compilerOptions
- db/package.json
- OnboardingFlow
- web/package.json
- api/package.json
- scripts
- notifications/package.json
- tasks
- contracts/package.json
- matching/package.json
- compilerOptions
- config/package.json
- home/page.tsx
- server.ts
- RideCreator
- worker/package.json
- Nexar Design System
- config/tsconfig.json
- ui/tsconfig.json
- matching/src/index.ts
- middleware.ts
- next-env.d.ts
- config/src/index.ts
- notifications/src/index.ts
- storage/src/index.ts
- ui/src/index.ts
- What You Must Do When Invoked
- Employee Carpool MVP — Build Specification
- graphify reference: extra exports and benchmark
- storage/package.json
- ui/package.json
- api/tsconfig.json
- worker/tsconfig.json
- Nexar
- graphify reference: query, path, explain
- contracts/tsconfig.json
- db/tsconfig.json
- matching/tsconfig.json
- notifications/tsconfig.json
- storage/tsconfig.json
- graphify reference: add a URL and watch a folder
- graphify reference: commit hook and native CLAUDE.md integration
- graphify reference: incremental update and cluster-only
- graphify reference: GitHub clone and cross-repo merge
- graphify reference: transcribe video and audio
- .claude/CLAUDE.md
- extraction-spec.md

## God Nodes (most connected - your core abstractions)
1. `Nexar Design System` - 14 edges
2. `scripts` - 13 edges
3. `Employee Carpool MVP — Build Specification` - 13 edges
4. `What You Must Do When Invoked` - 12 edges
5. `compilerOptions` - 11 edges
6. `OnboardingFlow()` - 10 edges
7. `/graphify` - 10 edges
8. `@clerk/nextjs` - 8 edges
9. `graphify reference: extra exports and benchmark` - 8 edges
10. `Core Components` - 8 edges

## Surprising Connections (you probably didn't know these)
- `runNightlyMatching()` --calls--> `createMatchGroups()`  [EXTRACTED]
  apps/worker/src/worker.ts → packages/matching/src/index.ts
- `HomeDashboard()` --calls--> `firstName()`  [EXTRACTED]
  apps/web/app/home/page.tsx → apps/web/app/profile.ts
- `HomeDashboard()` --calls--> `formatCommuteDays()`  [EXTRACTED]
  apps/web/app/home/page.tsx → apps/web/app/profile.ts
- `HomeDashboard()` --calls--> `maskedPlate()`  [EXTRACTED]
  apps/web/app/home/page.tsx → apps/web/app/profile.ts
- `ProfileView()` --calls--> `firstName()`  [EXTRACTED]
  apps/web/app/profile/page.tsx → apps/web/app/profile.ts

## Import Cycles
- None detected.

## Communities (49 total, 11 thin omitted)

### Community 0 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, incremental, jsx, lib, noEmit, plugins, exclude (+3 more)

### Community 1 - "db/package.json"
Cohesion: 0.07
Nodes (26): dependencies, dotenv, drizzle-orm, postgres, devDependencies, drizzle-kit, tsx, @types/node (+18 more)

### Community 2 - "OnboardingFlow"
Cohesion: 0.36
Nodes (6): OnboardingFlow(), nextStep(), submit(), update(), useCurrentLocation(), validateCurrentStep()

### Community 3 - "web/package.json"
Cohesion: 0.04
Nodes (39): dmSans, metadata, poppins, locationIcon, LocationMapProps, PUNE_CENTER, LocationMap, dependencies (+31 more)

### Community 4 - "api/package.json"
Cohesion: 0.05
Nodes (36): dependencies, @clerk/backend, dotenv, drizzle-orm, fastify, @fastify/cors, @nexar/contracts, @nexar/db (+28 more)

### Community 5 - "scripts"
Cohesion: 0.08
Nodes (25): devDependencies, prettier, turbo, typescript, engines, node, typescript, name (+17 more)

### Community 6 - "notifications/package.json"
Cohesion: 0.22
Nodes (8): devDependencies, typescript, typescript, name, private, scripts, typecheck, type

### Community 7 - "tasks"
Cohesion: 0.12
Nodes (15): dependsOn, outputs, cache, persistent, dependsOn, $schema, tasks, build (+7 more)

### Community 8 - "contracts/package.json"
Cohesion: 0.11
Nodes (17): dependencies, zod, devDependencies, typescript, vitest, exports, typescript, vitest (+9 more)

### Community 9 - "matching/package.json"
Cohesion: 0.13
Nodes (14): devDependencies, typescript, vitest, exports, typescript, vitest, main, name (+6 more)

### Community 10 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, esModuleInterop, isolatedModules, module, moduleResolution, noImplicitOverride, noUncheckedIndexedAccess, resolveJsonModule (+3 more)

### Community 11 - "config/package.json"
Cohesion: 0.17
Nodes (11): dependencies, zod, devDependencies, typescript, typescript, zod, name, private (+3 more)

### Community 12 - "home/page.tsx"
Cohesion: 0.11
Nodes (25): AppShell(), navItems, dayOptions, HomeDashboard(), RideMode, RideRequest, dayOptions, initialForm (+17 more)

### Community 13 - "server.ts"
Cohesion: 0.06
Nodes (44): app, AuthenticatedRequest, ClerkIdentity, createRideRequest(), getCurrentUser(), onboardingSchema, port, profileRolePreference() (+36 more)

### Community 15 - "worker/package.json"
Cohesion: 0.06
Nodes (32): dependencies, bullmq, dotenv, drizzle-orm, ioredis, @nexar/db, @nexar/matching, devDependencies (+24 more)

### Community 16 - "Nexar Design System"
Cohesion: 0.07
Nodes (26): Accessibility and Privacy, App shell, Color System, Core Components, Dark theme, Design Intent, Design Review Checklist, Geometry and Layout (+18 more)

### Community 17 - "config/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, extends, include, ../../tsconfig.base.json

### Community 18 - "ui/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, extends, include, ../../tsconfig.base.json

### Community 19 - "matching/src/index.ts"
Cohesion: 0.25
Nodes (9): createMatchGroups(), distanceMeters(), entryBucket(), MatchCandidate, MatchGroup, MAX_HOME_DISTANCE_METERS, MAX_OFFICE_WALK_METERS, REQUIRED_GROUP_SIZE (+1 more)

### Community 28 - "What You Must Do When Invoked"
Cohesion: 0.08
Nodes (24): For /graphify add and --watch, For /graphify query, For the commit hook and native CLAUDE.md integration, For --update and --cluster-only, /graphify, Honesty Rules, Interpreter guard for subcommands, Part A - Structural extraction for code files (+16 more)

### Community 29 - "Employee Carpool MVP — Build Specification"
Cohesion: 0.11
Nodes (17): 10. Data Model (minimum viable tables), 11. Explicitly Out of Scope for MVP, 12. Suggested Build Order, 1. Core Concept, 2. Hard Constraints (do not violate in design), 3. Legal Guardrails to Bake Into the Product (non-negotiable for MVP), 4. Roles, 5. Minimal Interface — Field List (keep both screens deliberately sparse) (+9 more)

### Community 31 - "graphify reference: extra exports and benchmark"
Cohesion: 0.22
Nodes (8): graphify reference: extra exports and benchmark, Step 6b - Wiki (only if --wiki flag), Step 7 - Neo4j export (only if --neo4j or --neo4j-push flag), Step 7a - FalkorDB export (only if --falkordb or --falkordb-push flag), Step 7b - SVG export (only if --svg flag), Step 7c - GraphML export (only if --graphml flag), Step 7d - MCP server (only if --mcp flag), Step 8 - Token reduction benchmark (only if total_words > 5000)

### Community 32 - "storage/package.json"
Cohesion: 0.22
Nodes (8): devDependencies, typescript, typescript, name, private, scripts, typecheck, type

### Community 33 - "ui/package.json"
Cohesion: 0.22
Nodes (8): devDependencies, typescript, typescript, name, private, scripts, typecheck, type

### Community 37 - "api/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, extends, include, ../../tsconfig.base.json

### Community 38 - "worker/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, extends, include, ../../tsconfig.base.json

### Community 39 - "Nexar"
Cohesion: 0.33
Nodes (4): graphify, Architecture, Local setup, Nexar

### Community 40 - "graphify reference: query, path, explain"
Cohesion: 0.33
Nodes (5): For /graphify explain, For /graphify path, graphify reference: query, path, explain, Step 0 — Constrained query expansion (REQUIRED before traversal), Step 1 — Traversal

### Community 41 - "contracts/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, extends, include, ../../tsconfig.base.json

### Community 42 - "db/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, extends, include, ../../tsconfig.base.json

### Community 43 - "matching/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, extends, include, ../../tsconfig.base.json

### Community 44 - "notifications/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, extends, include, ../../tsconfig.base.json

### Community 45 - "storage/tsconfig.json"
Cohesion: 0.33
Nodes (5): compilerOptions, outDir, extends, include, ../../tsconfig.base.json

### Community 46 - "graphify reference: add a URL and watch a folder"
Cohesion: 0.50
Nodes (3): For /graphify add, For --watch, graphify reference: add a URL and watch a folder

### Community 47 - "graphify reference: commit hook and native CLAUDE.md integration"
Cohesion: 0.50
Nodes (3): For git commit hook, For native CLAUDE.md integration, graphify reference: commit hook and native CLAUDE.md integration

### Community 48 - "graphify reference: incremental update and cluster-only"
Cohesion: 0.50
Nodes (3): For --cluster-only, For --update (incremental re-extraction), graphify reference: incremental update and cluster-only

## Knowledge Gaps
- **371 isolated node(s):** `name`, `private`, `dev`, `build`, `lint` (+366 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 416 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `postgres` connect `server.ts` to `db/package.json`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `bullmq` connect `worker/package.json` to `server.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `ioredis` connect `worker/package.json` to `server.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `name`, `private`, `dev` to the rest of the system?**
  _371 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `db/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `web/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `api/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._