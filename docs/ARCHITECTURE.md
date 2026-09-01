# Drydock Architecture

## System Overview

Drydock is a local-first ship-acceptance studio built on a verdict-driven architecture. It processes agent-authored PRs through a pipeline of validation modules and produces a binary verdict (MERGE / BLOCK / NEEDS_EYES).

## Core Components

### 1. Ship Packet Processor

**Location:** `src/modules/processor.ts`

The central orchestrator that:
- Accepts a PR (local repo path or GitHub URL)
- Executes all validation modules in sequence
- Aggregates results into a Ship Packet
- Determines final verdict based on fail-closed logic

**Key Methods:**
- `process(input: ProcessorInput): Promise<ShipPacket>` - Main entry point

### 2. Witness Module

**Location:** `src/modules/witness.ts`

Creates a cryptographically-verified receipt chain of all operations.

**Features:**
- Records every tool invocation (git, npm, test runner)
- Computes SHA-256 hash for each entry
- Validates chain integrity
- Provides tamper-evident audit trail

**Chain Entry:**
```typescript
{
  timestamp: string;
  tool: string;
  action: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  hash: string;  // SHA-256 digest
}
```

### 3. Parallax Module

**Location:** `src/modules/parallax.ts`

Detects conflicts between PR claims and actual evidence.

**Checks:**
- Fix claims without test changes → Medium conflict
- Refactor claims with new features → Low conflict
- Breaking changes without version indication → High conflict

**Verdict Impact:**
- High severity conflicts → NEEDS_EYES
- Medium/low conflicts → Warning only

### 4. Blast Radius Module

**Location:** `src/modules/blast-radius.ts`

Maps the impact surface of the PR.

**Analysis:**
- File changes (additions, deletions, modifications)
- Package dependencies affected
- Routes/endpoints modified
- Critical file detection (config, schema, migrations)

**Scoring:**
- Base: 1 point per file
- +10% of total line changes
- +5 points per critical file

### 5. Contracts Module

**Location:** `src/modules/contracts.ts`

Enforces project-defined requirements via `drydock.yaml`.

**Contract Types:**

1. **Required Tests** - Regex patterns that must match test names
2. **Forbidden Paths** - Patterns that must not appear in changed files
3. **Required Docs** - Keywords that must appear in PR description or docs

**Failure Mode:** Fail-closed. Any violation → BLOCK verdict.

### 6. Rebuild Module

**Location:** `src/modules/rebuild.ts`

Executes isolated rebuild of the PR.

**Process:**
1. Runs `npm run build` in PR repo
2. Captures stdout/stderr
3. Records exit code and duration
4. Returns success/failure

**Failure Mode:** Build failure → immediate BLOCK.

### 7. Test Replay Module

**Location:** `src/modules/test-replay.ts`

Re-runs tests in isolation to detect non-determinism.

**Process:**
1. Executes `npm test` in PR repo
2. Parses test output for pass/fail counts
3. Detects divergence from expected results
4. Marks fail-closed if any test fails

**Failure Mode:** Any test failure or divergence → BLOCK.

## Data Layer

### Database Schema

**Location:** `src/db/schema.ts`

SQLite database with single `ship_packets` table:

```sql
CREATE TABLE ship_packets (
  id TEXT PRIMARY KEY,
  pr_url TEXT,
  pr_number INTEGER,
  pr_title TEXT,
  pr_author TEXT,
  repo_path TEXT,
  verdict TEXT,  -- MERGE | BLOCK | NEEDS_EYES
  verdict_reasons TEXT,  -- JSON array
  created_at TEXT,
  updated_at TEXT,
  
  -- Serialized module results
  rebuild_data TEXT,
  test_replay_data TEXT,
  blast_radius_data TEXT,
  contracts_data TEXT,
  witness_data TEXT,
  parallax_data TEXT
);
```

**Repository Pattern:** `src/db/repository.ts` provides CRUD operations.

## Verdict Logic

The processor determines verdict using fail-closed logic:

```typescript
if (!rebuild.success) {
  return BLOCK("Build failed");
}

if (testReplay.failClosed || !testReplay.success) {
  return BLOCK("Tests failed or diverged");
}

if (!contracts.passed) {
  return BLOCK("Contract violations");
}

if (parallax.hasHighSeverityConflicts) {
  return NEEDS_EYES("High severity conflicts");
}

return MERGE("All checks passed");
```

## UI Architecture

### Next.js App Router

**Location:** `src/app/`

- `/` - Inbox listing all ship packets
- `/packet/[id]` - Detailed view of single ship packet
- `/api/export/[id]` - HTML export endpoint

### Components

- `layout.tsx` - Root layout with header
- `page.tsx` - Home page with packet list
- `packet/[id]/page.tsx` - Packet detail view
- `packet/[id]/ExportButton.tsx` - Client-side export trigger

### Styling

Global CSS (`globals.css`) with:
- Verdict badges (color-coded by verdict)
- Card-based layout
- Responsive grid system
- Dark code blocks
- Accessible color contrasts

## CLI Architecture

**Location:** `src/cli/accept.ts`

Simple script that:
1. Accepts repo path as argument
2. Instantiates processor
3. Processes ship packet
4. Prints summary
5. Exits 0 (MERGE) or 1 (BLOCK/NEEDS_EYES)

## Testing Strategy

**Location:** `src/test/`

- **Unit tests** - Each module tested in isolation
- **Integration tests** - Full processor pipeline
- **Fixture tests** - Prove verdict differentiation
- **No live LLMs** - All deterministic

Test count: 26+ passing tests

## Data Flow

```
┌─────────────────┐
│  PR Input       │
│  (repo path)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Processor      │◄──┐
└────────┬────────┘   │
         │            │
         ├──► Witness Chain
         │            │
         ├──► Rebuild Module
         │            │
         ├──► Test Replay
         │            │
         ├──► Blast Radius
         │            │
         ├──► Contracts
         │            │
         ├──► Parallax
         │            │
         ▼            │
┌─────────────────┐  │
│  Ship Packet    │──┘
│  (with verdict) │
└────────┬────────┘
         │
         ├──► Database (SQLite)
         │
         ├──► UI (Next.js)
         │
         └──► HTML Export
```

## Failure Modes

1. **Build failure** → BLOCK (no further checks)
2. **Test failure** → BLOCK (fail-closed)
3. **Test divergence** → BLOCK (non-determinism)
4. **Contract violation** → BLOCK (policy enforcement)
5. **High severity conflict** → NEEDS_EYES (human required)
6. **All checks pass** → MERGE (safe to ship)

## Extension Points

### Adding New Modules

1. Create module in `src/modules/`
2. Define types in `src/types/`
3. Integrate in `processor.ts`
4. Add tests in `src/test/`
5. Update UI to display results

### Custom Contracts

Add new contract types in `contracts.ts`:
- Code coverage thresholds
- Dependency vulnerability checks
- Performance regression detection
- Security scanning results

### Custom Verdicts

Extend verdict enum:
- `NEEDS_REVIEW` - Manual review required
- `NEEDS_REBASE` - Conflicts with base
- `NEEDS_APPROVAL` - Requires specific approver

## Security Considerations

- **Local-first** - No external API calls
- **Isolated execution** - Each PR tested in isolation
- **Fail-closed** - Unknown states → BLOCK
- **Audit trail** - Complete witness chain
- **No credential exposure** - Forbidden paths enforced

## Performance

- SQLite for fast local queries
- Better-sqlite3 (synchronous) for simplicity
- Indexed by created_at and verdict
- No external network calls
- Build/test timeout: 5 minutes each

## Future Enhancements

- Parallel module execution
- Incremental contract loading
- GitHub API integration
- Slack/email notifications
- Historical trend analysis
- Replay comparison (before/after)
