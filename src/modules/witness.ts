import crypto from 'crypto';
import type { WitnessChain, WitnessEntry } from '@/types';

export class WitnessModule {
  private entries: WitnessEntry[] = [];

  record(tool: string, action: string, inputs: Record<string, unknown>, outputs: Record<string, unknown>): void {
    const entry: WitnessEntry = {
      timestamp: new Date().toISOString(),
      tool,
      action,
      inputs,
      outputs,
      hash: this.computeHash({ tool, action, inputs, outputs }),
    };
    
    this.entries.push(entry);
  }

  getChain(): WitnessChain {
    return {
      entries: this.entries,
      valid: this.validateChain(),
    };
  }

  private computeHash(data: unknown): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex')
      .substring(0, 16);
  }

  private validateChain(): boolean {
    for (const entry of this.entries) {
      const expectedHash = this.computeHash({
        tool: entry.tool,
        action: entry.action,
        inputs: entry.inputs,
        outputs: entry.outputs,
      });
      
      if (entry.hash !== expectedHash) {
        return false;
      }
    }
    
    return true;
  }
}
