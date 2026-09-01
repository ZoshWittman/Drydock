# 🚢 Drydock

**Ship-acceptance studio for agent-authored PRs**

The missing gate between "agent opened a PR" and "production can trust this change."

## What is Drydock?

Drydock is a local-first tool that provides comprehensive ship-acceptance testing for PRs authored by AI agents. It's not a chat UI, not another agent runtime, and not incremental—it's a complete verdict system that tells you whether an agent's PR is safe to ship.

### Why Not Incremental?

Traditional CI/CD gives you pieces (build passed, tests green) but leaves the integration question to humans. Drydock delivers a **binary verdict** (MERGE / BLOCK / NEEDS_EYES) based on:

1. **Isolated rebuild + test replay** - Fail-closed if anything diverges
2. **Blast-radius map** - Files, packages, routes impacted
3. **Contract checks** - Required tests, forbidden paths, must-mention docs
4. **Witness chain** - Cryptographic receipt of all operations
5. **Parallax checks** - PR assertions vs actual evidence

You get a **Ship Packet**: a portable HTML+JSON artifact containing everything needed to trust (or reject) the change.

## Benefits

✅ **Zero-trust validation** - Don't trust the agent's word; verify everything  
✅ **Fail-closed safety** - If replay diverges or fails, automatic BLOCK  
✅ **Contract enforcement** - Define required tests, forbidden paths, doc requirements  
✅ **Audit trail** - Complete witness chain of all operations  
✅ **Local-first** - No external dependencies, runs on your machine  
✅ **Portable evidence** - Export ship packets as standalone HTML  

## Installation

```bash
git clone https://github.com/ZoshWittman/Drydock.git
cd Drydock
npm install
```

## Usage

### CLI: Accept a PR

```bash
npm run accept -- /path/to/pr-repo
```

The CLI exits 0 for MERGE verdict, 1 for BLOCK.

### Web UI: Review Ship Packets

```bash
npm run dev
```

Open http://localhost:43123 to browse ship packets, view details, and export HTML reports.

### Build for Production

```bash
npm run build
npm start
```

## Fixtures

Two fixtures prove verdict differentiation:

**fixtures/good-pr** → MERGE  
- ✓ Build passes  
- ✓ Tests pass  
- ✓ Contracts satisfied  

**fixtures/bad-pr** → BLOCK  
- ✗ Build fails  
- ✗ Tests fail  
- ✗ Violates forbidden paths  

Test them:
```bash
npm run accept -- fixtures/good-pr  # exits 0
npm run accept -- fixtures/bad-pr   # exits 1
```

## Ship Packet Anatomy

Every processed PR becomes a **Ship Packet** containing:

1. **Rebuild Result** - Did the code build successfully?
2. **Test Replay** - Did all tests pass? Did any diverge?
3. **Blast Radius** - Which files/packages/routes changed?
4. **Contracts** - Are required tests present? Forbidden paths avoided?
5. **Witness Chain** - Cryptographic receipt of all operations
6. **Parallax** - Do PR claims match evidence?
7. **Verdict** - MERGE / BLOCK / NEEDS_EYES with reasons

## Contract Format

Define a `drydock.yaml` in your repo:

```yaml
requiredTests:
  - "auth"
  - "security"

forbiddenPaths:
  - "secrets"
  - "credentials"
  - "\.env"

requiredDocs:
  - "migration"
  - "breaking"
```

Drydock enforces these contracts and blocks PRs that violate them.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system design.  
See [docs/SEQUENCE.md](docs/SEQUENCE.md) for execution flow.  
See [docs/architecture/](docs/architecture/) for interactive component map.

## Testing

```bash
npm test
```

Comprehensive test suite covering:
- Module unit tests (Witness, Parallax, Blast-radius, Contracts)
- Processor integration tests
- Fixture verdict differentiation
- Database persistence

## Tech Stack

- **TypeScript** - Type-safe implementation
- **Next.js 15** - App Router for web UI
- **SQLite** - Local-first database via better-sqlite3
- **Vitest** - Fast unit testing
- **Port 43123** - Default UI port

## License

MIT

## What Drydock Is NOT

❌ **Not Homefield** (offline harness bake-off)  
❌ **Not Redline** (prompt A/B testing)  
❌ **Not another agent runtime**  
❌ **Not Outside/Weather** (external tooling)

Witness and Parallax are inline modules, not separate products.

## Credits

Built with the ship-acceptance pattern in mind: comprehensive, fail-closed, verdict-driven.

---

**Ready to trust agent PRs?** Install Drydock and start building ship packets.
