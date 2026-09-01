import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import type { ShipPacket, Verdict, FileChange, TicketContract } from '@/types';
import { WitnessModule } from './witness';
import { ParallaxModule } from './parallax';
import { BlastRadiusModule } from './blast-radius';
import { ContractsModule } from './contracts';
import { RebuildModule } from './rebuild';
import { TestReplayModule } from './test-replay';

export interface ProcessorInput {
  repoPath: string;
  prUrl?: string;
  prNumber?: number;
  prTitle?: string;
  prAuthor?: string;
  prBody?: string;
  baseBranch?: string;
  headBranch?: string;
}

export class ShipPacketProcessor {
  private witness: WitnessModule;
  private parallax: ParallaxModule;
  private blastRadius: BlastRadiusModule;
  private contracts: ContractsModule;
  private rebuild: RebuildModule;
  private testReplay: TestReplayModule;

  constructor() {
    this.witness = new WitnessModule();
    this.parallax = new ParallaxModule();
    this.blastRadius = new BlastRadiusModule();
    this.contracts = new ContractsModule();
    this.rebuild = new RebuildModule();
    this.testReplay = new TestReplayModule();
  }

  async process(input: ProcessorInput): Promise<ShipPacket> {
    const id = this.generateId();
    const now = new Date().toISOString();

    this.witness.record('processor', 'start', { repoPath: input.repoPath }, {});

    const files = this.getChangedFiles(input.repoPath);
    const diff = this.getDiff(input.repoPath);
    
    this.witness.record('git', 'diff', { repoPath: input.repoPath }, { fileCount: files.length });

    const blastRadiusResult = this.blastRadius.analyzeChanges(files, input.repoPath);
    this.witness.record('blast-radius', 'analyze', { fileCount: files.length }, { score: blastRadiusResult.score });

    const rebuildResult = await this.rebuild.execute(input.repoPath);
    this.witness.record('rebuild', 'execute', {}, { success: rebuildResult.success });

    const testReplayResult = await this.testReplay.execute(input.repoPath);
    this.witness.record('test-replay', 'execute', {}, { 
      success: testReplayResult.success, 
      testCount: testReplayResult.tests.length 
    });

    const contract = this.loadContract(input.repoPath);
    const testNames = testReplayResult.tests.map(t => t.name);
    const filePaths = files.map(f => f.path);
    
    const contractsResult = this.contracts.check(
      contract,
      filePaths,
      testNames,
      input.prBody || ''
    );
    this.witness.record('contracts', 'check', { contract }, { passed: contractsResult.passed });

    this.parallax.addClaim('PR', input.prTitle || 'Untitled PR', [input.prBody || '']);
    this.parallax.checkConflicts(input.prBody || '', diff);
    const parallaxResult = this.parallax.getResult();
    this.witness.record('parallax', 'check', {}, { hasConflicts: parallaxResult.hasConflicts });

    const witnessChain = this.witness.getChain();

    const { verdict, reasons } = this.determineVerdict(
      rebuildResult,
      testReplayResult,
      contractsResult,
      parallaxResult
    );

    return {
      id,
      prUrl: input.prUrl || `file://${input.repoPath}`,
      prNumber: input.prNumber || 0,
      prTitle: input.prTitle || 'Local PR',
      prAuthor: input.prAuthor || 'unknown',
      repoPath: input.repoPath,
      baseBranch: input.baseBranch || 'main',
      headBranch: input.headBranch || 'feature',
      verdict,
      verdictReasons: reasons,
      createdAt: now,
      updatedAt: now,
      rebuild: rebuildResult,
      testReplay: testReplayResult,
      blastRadius: blastRadiusResult,
      contracts: contractsResult,
      witness: witnessChain,
      parallax: parallaxResult,
    };
  }

  private getChangedFiles(repoPath: string): FileChange[] {
    try {
      const output = execSync('git diff --numstat HEAD~1 HEAD 2>/dev/null || git diff --numstat --cached', {
        cwd: repoPath,
        encoding: 'utf-8',
      });

      const files: FileChange[] = [];
      const lines = output.trim().split('\n').filter(l => l);

      for (const line of lines) {
        const parts = line.split('\t');
        if (parts.length >= 3) {
          files.push({
            path: parts[2],
            additions: parseInt(parts[0]) || 0,
            deletions: parseInt(parts[1]) || 0,
            changeType: 'modified',
          });
        }
      }

      return files;
    } catch {
      return [];
    }
  }

  private getDiff(repoPath: string): string {
    try {
      return execSync('git diff HEAD~1 HEAD 2>/dev/null || git diff --cached', {
        cwd: repoPath,
        encoding: 'utf-8',
      });
    } catch {
      return '';
    }
  }

  private loadContract(repoPath: string): TicketContract {
    const contractPath = path.join(repoPath, 'drydock.yaml');
    if (fs.existsSync(contractPath)) {
      const content = fs.readFileSync(contractPath, 'utf-8');
      return this.parseYaml(content);
    }
    return {};
  }

  private parseYaml(content: string): TicketContract {
    const contract: TicketContract = {};
    const lines = content.split('\n');
    
    let currentSection: string | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('requiredTests:')) {
        currentSection = 'requiredTests';
        contract.requiredTests = [];
      } else if (trimmed.startsWith('forbiddenPaths:')) {
        currentSection = 'forbiddenPaths';
        contract.forbiddenPaths = [];
      } else if (trimmed.startsWith('requiredDocs:')) {
        currentSection = 'requiredDocs';
        contract.requiredDocs = [];
      } else if (trimmed.startsWith('-') && currentSection) {
        const value = trimmed.substring(1).trim().replace(/^['"]|['"]$/g, '');
        if (currentSection === 'requiredTests' && contract.requiredTests) {
          contract.requiredTests.push(value);
        } else if (currentSection === 'forbiddenPaths' && contract.forbiddenPaths) {
          contract.forbiddenPaths.push(value);
        } else if (currentSection === 'requiredDocs' && contract.requiredDocs) {
          contract.requiredDocs.push(value);
        }
      }
    }
    
    return contract;
  }

  private determineVerdict(
    rebuild: any,
    testReplay: any,
    contracts: any,
    parallax: any
  ): { verdict: Verdict; reasons: string[] } {
    const reasons: string[] = [];
    
    if (!rebuild.success) {
      reasons.push('Build failed');
      return { verdict: 'BLOCK', reasons };
    }
    
    if (testReplay.failClosed || !testReplay.success) {
      reasons.push('Tests failed or diverged');
      return { verdict: 'BLOCK', reasons };
    }
    
    if (!contracts.passed) {
      const failedRequired = contracts.requiredTests.filter((t: any) => !t.found);
      const violatedPaths = contracts.forbiddenPaths.filter((p: any) => p.violated);
      const missingDocs = contracts.requiredDocs.filter((d: any) => !d.found);
      
      if (failedRequired.length > 0) {
        reasons.push(`Missing required tests: ${failedRequired.map((t: any) => t.pattern).join(', ')}`);
      }
      if (violatedPaths.length > 0) {
        reasons.push(`Forbidden paths violated: ${violatedPaths.map((p: any) => p.pattern).join(', ')}`);
      }
      if (missingDocs.length > 0) {
        reasons.push(`Missing required documentation: ${missingDocs.map((d: any) => d.keyword).join(', ')}`);
      }
      
      return { verdict: 'BLOCK', reasons };
    }
    
    if (parallax.hasConflicts) {
      const highSeverity = parallax.conflicts.filter((c: any) => c.severity === 'high');
      if (highSeverity.length > 0) {
        reasons.push('High severity conflicts detected');
        return { verdict: 'NEEDS_EYES', reasons };
      }
    }
    
    reasons.push('All checks passed');
    return { verdict: 'MERGE', reasons };
  }

  private generateId(): string {
    return `sp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }
}
