import type { BlastRadius, FileChange } from '@/types';

export class BlastRadiusModule {
  analyzeChanges(files: FileChange[], repoPath: string): BlastRadius {
    const packages = this.identifyPackages(files);
    const routes = this.identifyRoutes(files, repoPath);
    const score = this.calculateScore(files);

    return {
      files,
      packages,
      routes,
      score,
    };
  }

  private identifyPackages(files: FileChange[]): string[] {
    const packages = new Set<string>();

    for (const file of files) {
      if (file.path.includes('package.json')) {
        packages.add(file.path.replace('/package.json', ''));
      }

      const parts = file.path.split('/');
      if (parts.includes('node_modules')) {
        const idx = parts.indexOf('node_modules');
        if (idx + 1 < parts.length) {
          packages.add(parts[idx + 1]);
        }
      }
    }

    return Array.from(packages);
  }

  private identifyRoutes(files: FileChange[], repoPath: string): string[] {
    const routes = new Set<string>();

    for (const file of files) {
      if (file.path.match(/\/(pages|app|routes)\//)) {
        const routePath = this.extractRoutePath(file.path);
        if (routePath) {
          routes.add(routePath);
        }
      }

      if (file.path.includes('route.ts') || file.path.includes('page.tsx')) {
        const routePath = this.extractRoutePath(file.path);
        if (routePath) {
          routes.add(routePath);
        }
      }
    }

    return Array.from(routes);
  }

  private extractRoutePath(filePath: string): string | null {
    const match = filePath.match(/\/?(pages|app|routes)\/(.+)\.(tsx?|jsx?|ts|js)$/);
    if (match) {
      let routePath = match[2].replace(/\/index$/, '').replace(/\[(.+?)\]/g, ':$1');
      routePath = routePath.replace(/\/page$/, '').replace(/\/route$/, '');
      return '/' + routePath;
    }
    return null;
  }

  private calculateScore(files: FileChange[]): number {
    let score = 0;

    score += files.length;
    score += files.reduce((sum, f) => sum + f.additions + f.deletions, 0) / 10;

    const criticalFiles = files.filter(f => 
      f.path.includes('config') ||
      f.path.includes('schema') ||
      f.path.includes('migration') ||
      f.path.includes('.env')
    );
    score += criticalFiles.length * 5;

    return Math.round(score);
  }
}
