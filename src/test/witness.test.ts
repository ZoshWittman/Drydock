import { describe, it, expect } from 'vitest';
import { WitnessModule } from '@/modules/witness';

describe('WitnessModule', () => {
  it('should record witness entries', () => {
    const witness = new WitnessModule();
    
    witness.record('git', 'checkout', { branch: 'main' }, { success: true });
    witness.record('npm', 'test', {}, { exitCode: 0 });
    
    const chain = witness.getChain();
    
    expect(chain.entries).toHaveLength(2);
    expect(chain.entries[0].tool).toBe('git');
    expect(chain.entries[0].action).toBe('checkout');
    expect(chain.entries[1].tool).toBe('npm');
  });

  it('should validate witness chain', () => {
    const witness = new WitnessModule();
    
    witness.record('test', 'action', { input: 'data' }, { output: 'result' });
    
    const chain = witness.getChain();
    
    expect(chain.valid).toBe(true);
    expect(chain.entries[0].hash).toBeDefined();
    expect(chain.entries[0].hash.length).toBe(16);
  });

  it('should compute consistent hashes', () => {
    const witness1 = new WitnessModule();
    const witness2 = new WitnessModule();
    
    const inputs = { key: 'value' };
    const outputs = { result: 'data' };
    
    witness1.record('tool', 'action', inputs, outputs);
    witness2.record('tool', 'action', inputs, outputs);
    
    const chain1 = witness1.getChain();
    const chain2 = witness2.getChain();
    
    expect(chain1.entries[0].hash).toBe(chain2.entries[0].hash);
  });
});
