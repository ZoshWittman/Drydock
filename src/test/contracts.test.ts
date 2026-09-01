import { describe, it, expect } from 'vitest';
import { ContractsModule } from '@/modules/contracts';
import type { TicketContract } from '@/types';

describe('ContractsModule', () => {
  it('should pass when all required tests are present', () => {
    const contracts = new ContractsModule();
    
    const contract: TicketContract = {
      requiredTests: ['login', 'auth'],
    };
    
    const tests = ['test_login', 'test_auth', 'test_other'];
    
    const result = contracts.check(contract, [], tests, '');
    
    expect(result.passed).toBe(true);
    expect(result.requiredTests[0].found).toBe(true);
    expect(result.requiredTests[1].found).toBe(true);
  });

  it('should fail when required tests are missing', () => {
    const contracts = new ContractsModule();
    
    const contract: TicketContract = {
      requiredTests: ['security_check'],
    };
    
    const tests = ['test_login', 'test_auth'];
    
    const result = contracts.check(contract, [], tests, '');
    
    expect(result.passed).toBe(false);
    expect(result.requiredTests[0].found).toBe(false);
  });

  it('should detect forbidden path violations', () => {
    const contracts = new ContractsModule();
    
    const contract: TicketContract = {
      forbiddenPaths: ['secrets', 'credentials'],
    };
    
    const files = ['src/index.ts', 'src/secrets.ts', 'config/credentials.json'];
    
    const result = contracts.check(contract, files, [], '');
    
    expect(result.passed).toBe(false);
    expect(result.forbiddenPaths[0].violated).toBe(true);
    expect(result.forbiddenPaths[0].violatedFiles).toContain('src/secrets.ts');
    expect(result.forbiddenPaths[1].violated).toBe(true);
  });

  it('should check required documentation', () => {
    const contracts = new ContractsModule();
    
    const contract: TicketContract = {
      requiredDocs: ['migration', 'security'],
    };
    
    const prBody = 'This PR includes migration steps and security considerations';
    
    const result = contracts.check(contract, [], [], prBody);
    
    expect(result.passed).toBe(true);
    expect(result.requiredDocs[0].found).toBe(true);
    expect(result.requiredDocs[0].locations).toContain('PR description');
  });

  it('should fail when documentation is missing', () => {
    const contracts = new ContractsModule();
    
    const contract: TicketContract = {
      requiredDocs: ['breaking-changes'],
    };
    
    const result = contracts.check(contract, [], [], 'Simple bug fix');
    
    expect(result.passed).toBe(false);
    expect(result.requiredDocs[0].found).toBe(false);
  });

  it('should pass with no contract requirements', () => {
    const contracts = new ContractsModule();
    
    const result = contracts.check({}, [], [], '');
    
    expect(result.passed).toBe(true);
    expect(result.requiredTests).toHaveLength(0);
    expect(result.forbiddenPaths).toHaveLength(0);
  });
});
