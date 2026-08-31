# Drydock Execution Sequence

This document describes the step-by-step execution flow when processing a PR through Drydock.

## High-Level Flow

```
User Input → Processor → Modules → Verdict → Storage → UI/Export
```

## Detailed Sequence

### 1. Initialization

```
┌─────────────────────────────────────────┐
│ User runs: npm run accept -- <repo>     │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ CLI (src/cli/accept.ts)                 │
│ - Parse arguments                       │
│ - Resolve absolute path                 │
│ - Instantiate ShipPacketProcessor       │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 2. Processor Initialization

```
┌─────────────────────────────────────────┐
│ ShipPacketProcessor.process()           │
│ - Generate unique packet ID             │
│ - Initialize timestamp                  │
│ - Create module instances:              │
│   • WitnessModule                       │
│   • ParallaxModule                      │
│   • BlastRadiusModule                   │
│   • ContractsModule                     │
│   • RebuildModule                       │
│   • TestReplayModule                    │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 3. Witness Chain Initialization

```
┌─────────────────────────────────────────┐
│ WitnessModule.record()                  │
│ Entry 1: {                              │
│   tool: "processor",                    │
│   action: "start",                      │
│   inputs: { repoPath },                 │
│   outputs: {}                           │
│ }                                       │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 4. Git Analysis

```
┌─────────────────────────────────────────┐
│ Processor.getChangedFiles()             │
│ - Execute: git diff --numstat           │
│ - Parse additions/deletions             │
│ - Identify change types                 │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ Processor.getDiff()                     │
│ - Execute: git diff                     │
│ - Capture full diff text                │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ WitnessModule.record()                  │
│ Entry 2: {                              │
│   tool: "git",                          │
│   action: "diff",                       │
│   inputs: { repoPath },                 │
│   outputs: { fileCount }                │
│ }                                       │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 5. Blast Radius Analysis

```
┌─────────────────────────────────────────┐
│ BlastRadiusModule.analyzeChanges()      │
│ - Identify packages (package.json)      │
│ - Extract routes (app/, pages/)         │
│ - Calculate impact score                │
│ - Flag critical files (config, schema)  │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ WitnessModule.record()                  │
│ Entry 3: {                              │
│   tool: "blast-radius",                 │
│   action: "analyze",                    │
│   inputs: { fileCount },                │
│   outputs: { score }                    │
│ }                                       │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 6. Rebuild Execution

```
┌─────────────────────────────────────────┐
│ RebuildModule.execute()                 │
│ - Execute: npm run build                │
│ - Capture stdout/stderr                 │
│ - Record exit code                      │
│ - Measure duration                      │
└───────────────────┬─────────────────────┘
                    │
                    ├─► Success? Continue
                    │
                    └─► Failure? → verdict = BLOCK
                    │
                    ▼
┌─────────────────────────────────────────┐
│ WitnessModule.record()                  │
│ Entry 4: {                              │
│   tool: "rebuild",                      │
│   action: "execute",                    │
│   inputs: {},                           │
│   outputs: { success, exitCode }        │
│ }                                       │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 7. Test Replay

```
┌─────────────────────────────────────────┐
│ TestReplayModule.execute()              │
│ - Execute: npm test                     │
│ - Parse test output                     │
│ - Count pass/fail/skip                  │
│ - Detect divergence                     │
└───────────────────┬─────────────────────┘
                    │
                    ├─► All passed? Continue
                    │
                    └─► Failures? → verdict = BLOCK
                    │
                    ▼
┌─────────────────────────────────────────┐
│ WitnessModule.record()                  │
│ Entry 5: {                              │
│   tool: "test-replay",                  │
│   action: "execute",                    │
│   inputs: {},                           │
│   outputs: { success, testCount }       │
│ }                                       │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 8. Contract Loading & Checking

```
┌─────────────────────────────────────────┐
│ Processor.loadContract()                │
│ - Read drydock.yaml (if exists)         │
│ - Parse YAML into TicketContract        │
│ - Extract:                              │
│   • requiredTests                       │
│   • forbiddenPaths                      │
│   • requiredDocs                        │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ ContractsModule.check()                 │
│ - Check required tests (regex match)    │
│ - Check forbidden paths (violation)     │
│ - Check required docs (keyword search)  │
└───────────────────┬─────────────────────┘
                    │
                    ├─► All passed? Continue
                    │
                    └─► Violations? → verdict = BLOCK
                    │
                    ▼
┌─────────────────────────────────────────┐
│ WitnessModule.record()                  │
│ Entry 6: {                              │
│   tool: "contracts",                    │
│   action: "check",                      │
│   inputs: { contract },                 │
│   outputs: { passed }                   │
│ }                                       │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 9. Parallax Analysis

```
┌─────────────────────────────────────────┐
│ ParallaxModule.addClaim()               │
│ - Extract claims from PR title/body     │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ ParallaxModule.checkConflicts()         │
│ - Compare PR claims vs diff evidence    │
│ - Detect:                               │
│   • Fix without tests → Medium          │
│   • Refactor with features → Low        │
│   • Breaking without version → High     │
└───────────────────┬─────────────────────┘
                    │
                    ├─► High severity? → verdict = NEEDS_EYES
                    │
                    └─► No conflicts? Continue
                    │
                    ▼
┌─────────────────────────────────────────┐
│ WitnessModule.record()                  │
│ Entry 7: {                              │
│   tool: "parallax",                     │
│   action: "check",                      │
│   inputs: {},                           │
│   outputs: { hasConflicts }             │
│ }                                       │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 10. Witness Chain Finalization

```
┌─────────────────────────────────────────┐
│ WitnessModule.getChain()                │
│ - Compile all entries                   │
│ - Validate hash integrity               │
│ - Return complete chain                 │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 11. Verdict Determination

```
┌─────────────────────────────────────────┐
│ Processor.determineVerdict()            │
│                                         │
│ IF rebuild failed:                      │
│   → BLOCK("Build failed")               │
│                                         │
│ ELSE IF tests failed:                   │
│   → BLOCK("Tests failed or diverged")   │
│                                         │
│ ELSE IF contracts violated:             │
│   → BLOCK("Contract violations")        │
│                                         │
│ ELSE IF parallax high severity:         │
│   → NEEDS_EYES("Conflicts detected")    │
│                                         │
│ ELSE:                                   │
│   → MERGE("All checks passed")          │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 12. Ship Packet Assembly

```
┌─────────────────────────────────────────┐
│ Assemble ShipPacket                     │
│ {                                       │
│   id: "sp-...",                         │
│   verdict: "MERGE|BLOCK|NEEDS_EYES",    │
│   verdictReasons: [...],                │
│   rebuild: { ... },                     │
│   testReplay: { ... },                  │
│   blastRadius: { ... },                 │
│   contracts: { ... },                   │
│   witness: { ... },                     │
│   parallax: { ... },                    │
│   createdAt: "...",                     │
│   updatedAt: "..."                      │
│ }                                       │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 13. Persistence

```
┌─────────────────────────────────────────┐
│ saveShipPacket(packet)                  │
│ - Serialize module results to JSON      │
│ - INSERT INTO ship_packets              │
│ - Commit transaction                    │
└───────────────────┬─────────────────────┘
                    │
                    ▼
```

### 14. CLI Output & Exit

```
┌─────────────────────────────────────────┐
│ CLI Output                              │
│ - Print verdict                         │
│ - Print verdict reasons                 │
│ - Print module summaries                │
│ - Exit code:                            │
│   • 0 if MERGE                          │
│   • 1 if BLOCK or NEEDS_EYES            │
└─────────────────────────────────────────┘
```

## UI Flow (Alternative Path)

### Web UI Access

```
1. User visits http://localhost:43123

2. Next.js renders src/app/page.tsx
   - Calls listShipPackets()
   - Displays all packets in inbox view

3. User clicks on packet
   - Navigate to /packet/[id]
   - Renders src/app/packet/[id]/page.tsx
   - Calls getShipPacket(id)
   - Displays full packet details

4. User clicks "Export HTML"
   - Client-side fetch to /api/export/[id]
   - Server renders standalone HTML
   - Browser downloads file
```

## Timing Considerations

| Phase | Typical Duration |
|-------|-----------------|
| Git analysis | <1s |
| Blast radius | <1s |
| Rebuild | 5-60s |
| Test replay | 5-30s |
| Contracts | <1s |
| Parallax | <1s |
| Witness validation | <1s |
| Database save | <1s |
| **Total** | **~10-90s** |

## Error Handling

Each phase has fail-fast behavior:

1. **Git errors** → Cannot proceed (exit 1)
2. **Rebuild errors** → BLOCK verdict
3. **Test errors** → BLOCK verdict (fail-closed)
4. **Contract errors** → BLOCK verdict
5. **Witness errors** → Warning logged, continue
6. **Database errors** → Packet not saved, but verdict still returned

## Concurrent Execution

Currently sequential. Future optimization could parallelize:
- Blast radius + Contract loading
- Rebuild + Parallax analysis (post-git)

But fail-fast rebuild/test logic should remain sequential.
