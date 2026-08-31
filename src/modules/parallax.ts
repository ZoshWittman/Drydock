import type { ParallaxResult, Claim, Conflict } from '@/types';

export class ParallaxModule {
  private claims: Claim[] = [];
  private conflicts: Conflict[] = [];

  addClaim(source: string, statement: string, evidence: string[]): void {
    this.claims.push({
      source,
      statement,
      evidence,
      verified: evidence.length > 0,
    });
  }

  checkConflicts(prDescription: string, diff: string): void {
    const prLower = prDescription.toLowerCase();
    const diffLower = diff.toLowerCase();

    if (prLower.includes('fix') && !diffLower.includes('test')) {
      this.conflicts.push({
        claim: 'PR claims to fix issue',
        counterEvidence: ['No tests added or modified in diff'],
        severity: 'medium',
      });
    }

    if (prLower.includes('refactor') && diffLower.includes('feature')) {
      this.conflicts.push({
        claim: 'PR claims refactor',
        counterEvidence: ['Diff contains new feature code'],
        severity: 'low',
      });
    }

    if (prLower.includes('breaking') && !prLower.includes('major')) {
      this.conflicts.push({
        claim: 'Breaking change without version indication',
        counterEvidence: ['PR mentions breaking but not major version'],
        severity: 'high',
      });
    }
  }

  getResult(): ParallaxResult {
    return {
      claims: this.claims,
      conflicts: this.conflicts,
      hasConflicts: this.conflicts.length > 0,
    };
  }
}
