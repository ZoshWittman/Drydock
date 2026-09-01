import type { ContractCheckResult, TicketContract, RequiredTestCheck, ForbiddenPathCheck, RequiredDocCheck } from '@/types';

export class ContractsModule {
  check(
    contract: TicketContract,
    files: string[],
    tests: string[],
    prBody: string
  ): ContractCheckResult {
    const requiredTests = this.checkRequiredTests(contract.requiredTests || [], tests);
    const forbiddenPaths = this.checkForbiddenPaths(contract.forbiddenPaths || [], files);
    const requiredDocs = this.checkRequiredDocs(contract.requiredDocs || [], prBody, files);

    const passed = 
      requiredTests.every(r => r.found) &&
      forbiddenPaths.every(f => !f.violated) &&
      requiredDocs.every(d => d.found);

    return {
      passed,
      requiredTests,
      forbiddenPaths,
      requiredDocs,
    };
  }

  private checkRequiredTests(patterns: string[], tests: string[]): RequiredTestCheck[] {
    return patterns.map(pattern => {
      const regex = new RegExp(pattern);
      const matchedTests = tests.filter(test => regex.test(test));
      
      return {
        pattern,
        found: matchedTests.length > 0,
        matchedTests,
      };
    });
  }

  private checkForbiddenPaths(patterns: string[], files: string[]): ForbiddenPathCheck[] {
    return patterns.map(pattern => {
      const regex = new RegExp(pattern);
      const violatedFiles = files.filter(file => regex.test(file));
      
      return {
        pattern,
        violated: violatedFiles.length > 0,
        violatedFiles,
      };
    });
  }

  private checkRequiredDocs(keywords: string[], prBody: string, files: string[]): RequiredDocCheck[] {
    return keywords.map(keyword => {
      const locations: string[] = [];
      
      if (prBody.toLowerCase().includes(keyword.toLowerCase())) {
        locations.push('PR description');
      }
      
      const docFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.txt'));
      for (const file of docFiles) {
        if (file.toLowerCase().includes(keyword.toLowerCase())) {
          locations.push(file);
        }
      }
      
      return {
        keyword,
        found: locations.length > 0,
        locations,
      };
    });
  }
}
