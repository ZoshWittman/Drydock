import { execSync } from 'child_process';
import type { RebuildResult } from '@/types';

export class RebuildModule {
  async execute(repoPath: string): Promise<RebuildResult> {
    const startTime = Date.now();
    
    try {
      const stdout = execSync('npm run build', {
        cwd: repoPath,
        encoding: 'utf-8',
        timeout: 300000,
        stdio: 'pipe',
      });
      
      const duration = Date.now() - startTime;
      
      return {
        success: true,
        exitCode: 0,
        duration,
        stdout,
        stderr: '',
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        success: false,
        exitCode: error.status || 1,
        duration,
        stdout: error.stdout?.toString() || '',
        stderr: error.stderr?.toString() || error.message,
      };
    }
  }
}
