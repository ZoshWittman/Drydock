import { describe, it, expect } from 'vitest';
import { ParallaxModule } from '@/modules/parallax';

describe('ParallaxModule', () => {
  it('should add claims', () => {
    const parallax = new ParallaxModule();
    
    parallax.addClaim('PR', 'Fixes bug #123', ['Updated tests', 'Added fix']);
    
    const result = parallax.getResult();
    
    expect(result.claims).toHaveLength(1);
    expect(result.claims[0].source).toBe('PR');
    expect(result.claims[0].verified).toBe(true);
  });

  it('should detect conflicts when fix has no tests', () => {
    const parallax = new ParallaxModule();
    
    parallax.checkConflicts('This PR fixes a critical bug', 'function bugFix() { return true; }');
    
    const result = parallax.getResult();
    
    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0].claim).toContain('fix');
  });

  it('should detect refactor vs feature conflicts', () => {
    const parallax = new ParallaxModule();
    
    parallax.checkConflicts('Refactoring code', 'function newFeature() {}');
    
    const result = parallax.getResult();
    
    expect(result.hasConflicts).toBe(true);
  });

  it('should detect breaking changes without version indication', () => {
    const parallax = new ParallaxModule();
    
    parallax.checkConflicts('This is a breaking change', '');
    
    const result = parallax.getResult();
    
    expect(result.hasConflicts).toBe(true);
    const breakingConflict = result.conflicts.find(c => c.severity === 'high');
    expect(breakingConflict).toBeDefined();
  });

  it('should not detect conflicts for clean PRs', () => {
    const parallax = new ParallaxModule();
    
    parallax.checkConflicts('Added new documentation', 'README.md changes');
    
    const result = parallax.getResult();
    
    expect(result.hasConflicts).toBe(false);
    expect(result.conflicts).toHaveLength(0);
  });
});
