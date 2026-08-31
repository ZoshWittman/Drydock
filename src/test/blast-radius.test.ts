import { describe, it, expect } from 'vitest';
import { BlastRadiusModule } from '@/modules/blast-radius';
import type { FileChange } from '@/types';

describe('BlastRadiusModule', () => {
  it('should analyze file changes', () => {
    const blastRadius = new BlastRadiusModule();
    
    const files: FileChange[] = [
      { path: 'src/index.ts', additions: 10, deletions: 5, changeType: 'modified' },
      { path: 'src/utils.ts', additions: 20, deletions: 3, changeType: 'modified' },
    ];
    
    const result = blastRadius.analyzeChanges(files, '/repo');
    
    expect(result.files).toHaveLength(2);
    expect(result.score).toBeGreaterThan(0);
  });

  it('should identify routes from app directory', () => {
    const blastRadius = new BlastRadiusModule();
    
    const files: FileChange[] = [
      { path: 'app/dashboard/page.tsx', additions: 10, deletions: 0, changeType: 'added' },
      { path: 'app/api/users/route.ts', additions: 15, deletions: 0, changeType: 'added' },
    ];
    
    const result = blastRadius.analyzeChanges(files, '/repo');
    
    expect(result.routes.length).toBeGreaterThan(0);
  });

  it('should calculate higher scores for critical files', () => {
    const blastRadius = new BlastRadiusModule();
    
    const criticalFiles: FileChange[] = [
      { path: 'config/database.ts', additions: 5, deletions: 5, changeType: 'modified' },
      { path: 'migrations/001.sql', additions: 10, deletions: 0, changeType: 'added' },
    ];
    
    const normalFiles: FileChange[] = [
      { path: 'src/utils.ts', additions: 5, deletions: 5, changeType: 'modified' },
    ];
    
    const criticalResult = blastRadius.analyzeChanges(criticalFiles, '/repo');
    const normalResult = blastRadius.analyzeChanges(normalFiles, '/repo');
    
    expect(criticalResult.score).toBeGreaterThan(normalResult.score);
  });

  it('should identify packages from package.json changes', () => {
    const blastRadius = new BlastRadiusModule();
    
    const files: FileChange[] = [
      { path: 'packages/core/package.json', additions: 3, deletions: 0, changeType: 'modified' },
      { path: 'packages/utils/package.json', additions: 2, deletions: 0, changeType: 'modified' },
    ];
    
    const result = blastRadius.analyzeChanges(files, '/repo');
    
    expect(result.packages.length).toBeGreaterThan(0);
  });
});
