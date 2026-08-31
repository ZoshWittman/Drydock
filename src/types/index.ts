export type Verdict = 'MERGE' | 'BLOCK' | 'NEEDS_EYES';

export interface ShipPacket {
  id: string;
  prUrl: string;
  prNumber: number;
  prTitle: string;
  prAuthor: string;
  repoPath: string;
  baseBranch: string;
  headBranch: string;
  verdict: Verdict;
  verdictReasons: string[];
  createdAt: string;
  updatedAt: string;
  
  // Core components
  rebuild: RebuildResult;
  testReplay: TestReplayResult;
  blastRadius: BlastRadius;
  contracts: ContractCheckResult;
  witness: WitnessChain;
  parallax: ParallaxResult;
}

export interface RebuildResult {
  success: boolean;
  exitCode: number;
  duration: number;
  stdout: string;
  stderr: string;
}

export interface TestReplayResult {
  success: boolean;
  failClosed: boolean;
  diverged: boolean;
  tests: TestResult[];
  duration: number;
}

export interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  duration: number;
  error?: string;
}

export interface BlastRadius {
  files: FileChange[];
  packages: string[];
  routes: string[];
  score: number;
}

export interface FileChange {
  path: string;
  additions: number;
  deletions: number;
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
}

export interface ContractCheckResult {
  passed: boolean;
  requiredTests: RequiredTestCheck[];
  forbiddenPaths: ForbiddenPathCheck[];
  requiredDocs: RequiredDocCheck[];
}

export interface RequiredTestCheck {
  pattern: string;
  found: boolean;
  matchedTests: string[];
}

export interface ForbiddenPathCheck {
  pattern: string;
  violated: boolean;
  violatedFiles: string[];
}

export interface RequiredDocCheck {
  keyword: string;
  found: boolean;
  locations: string[];
}

export interface WitnessChain {
  entries: WitnessEntry[];
  valid: boolean;
}

export interface WitnessEntry {
  timestamp: string;
  tool: string;
  action: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  hash: string;
}

export interface ParallaxResult {
  claims: Claim[];
  conflicts: Conflict[];
  hasConflicts: boolean;
}

export interface Claim {
  source: string;
  statement: string;
  evidence: string[];
  verified: boolean;
}

export interface Conflict {
  claim: string;
  counterEvidence: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface TicketContract {
  requiredTests?: string[];
  forbiddenPaths?: string[];
  requiredDocs?: string[];
}
