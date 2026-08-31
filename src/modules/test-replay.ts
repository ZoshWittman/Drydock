import { execSync } from 'child_process';
import type { TestReplayResult, TestResult } from '@/types';

export class TestReplayModule {
  async execute(repoPath: string): Promise<TestReplayResult> {
    const startTime = Date.now();
    
    try {
      const output = execSync('npm test 2>&1', {
        cwd: repoPath,
        encoding: 'utf-8',
        timeout: 300000,
      });
      
      const duration = Date.now() - startTime;
      const tests = this.parseTestOutput(output);
      const allPassed = tests.every(t => t.status === 'pass');
      
      return {
        success: allPassed,
        failClosed: false,
        diverged: false,
        tests,
        duration,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const output = error.stdout?.toString() || error.message;
      const tests = this.parseTestOutput(output);
      
      return {
        success: false,
        failClosed: true,
        diverged: tests.some(t => t.status === 'fail'),
        tests,
        duration,
      };
    }
  }

  private parseTestOutput(output: string): TestResult[] {
    const tests: TestResult[] = [];
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('✓') || line.includes('PASS')) {
        const name = line.replace(/^.*?✓\s*/, '').replace(/^.*?PASS\s*/, '').trim();
        if (name) {
          tests.push({
            name,
            status: 'pass',
            duration: 0,
          });
        }
      } else if (line.includes('✗') || line.includes('FAIL')) {
        const name = line.replace(/^.*?✗\s*/, '').replace(/^.*?FAIL\s*/, '').trim();
        if (name) {
          tests.push({
            name,
            status: 'fail',
            duration: 0,
          });
        }
      }
    }
    
    if (tests.length === 0 && output.includes('Test') && !output.includes('error')) {
      tests.push({
        name: 'default test suite',
        status: 'pass',
        duration: 0,
      });
    }
    
    return tests;
  }
}
