import { describe, it, expect } from 'vitest';
import { ShipPacketProcessor } from '@/modules/processor';
import path from 'path';

describe('ShipPacketProcessor', () => {
  it('should process good PR fixture as MERGE', async () => {
    const processor = new ShipPacketProcessor();
    const fixturePath = path.join(process.cwd(), 'fixtures/good-pr');
    
    const packet = await processor.process({
      repoPath: fixturePath,
      prTitle: 'Good PR',
      prAuthor: 'test',
      prBody: 'This is a test fixture for good PR',
    });
    
    expect(packet.verdict).toBe('MERGE');
    expect(packet.rebuild.success).toBe(true);
    expect(packet.testReplay.success).toBe(true);
    expect(packet.contracts.passed).toBe(true);
  }, 30000);

  it('should process bad PR fixture as BLOCK', async () => {
    const processor = new ShipPacketProcessor();
    const fixturePath = path.join(process.cwd(), 'fixtures/bad-pr');
    
    const packet = await processor.process({
      repoPath: fixturePath,
      prTitle: 'Bad PR',
      prAuthor: 'test',
      prBody: 'This is a test fixture for bad PR',
    });
    
    expect(packet.verdict).toBe('BLOCK');
    expect(packet.verdictReasons.length).toBeGreaterThan(0);
  }, 30000);

  it('should generate valid packet structure', async () => {
    const processor = new ShipPacketProcessor();
    const fixturePath = path.join(process.cwd(), 'fixtures/good-pr');
    
    const packet = await processor.process({
      repoPath: fixturePath,
      prTitle: 'Test PR',
      prAuthor: 'tester',
      prBody: 'Test fixture',
    });
    
    expect(packet.id).toBeDefined();
    expect(packet.id).toMatch(/^sp-/);
    expect(packet.createdAt).toBeDefined();
    expect(packet.updatedAt).toBeDefined();
    
    expect(packet.rebuild).toBeDefined();
    expect(packet.testReplay).toBeDefined();
    expect(packet.blastRadius).toBeDefined();
    expect(packet.contracts).toBeDefined();
    expect(packet.witness).toBeDefined();
    expect(packet.parallax).toBeDefined();
  }, 30000);

  it('should create valid witness chain', async () => {
    const processor = new ShipPacketProcessor();
    const fixturePath = path.join(process.cwd(), 'fixtures/good-pr');
    
    const packet = await processor.process({
      repoPath: fixturePath,
      prTitle: 'Test PR',
      prAuthor: 'tester',
      prBody: 'Test fixture',
    });
    
    expect(packet.witness.entries.length).toBeGreaterThan(0);
    expect(packet.witness.valid).toBe(true);
    
    expect(packet.witness.entries[0].tool).toBeDefined();
    expect(packet.witness.entries[0].action).toBeDefined();
    expect(packet.witness.entries[0].hash).toBeDefined();
  }, 30000);

  it('should calculate blast radius', async () => {
    const processor = new ShipPacketProcessor();
    const fixturePath = path.join(process.cwd(), 'fixtures/good-pr');
    
    const packet = await processor.process({
      repoPath: fixturePath,
      prTitle: 'Test PR',
      prAuthor: 'tester',
      prBody: 'Test fixture',
    });
    
    expect(packet.blastRadius.score).toBeGreaterThanOrEqual(0);
    expect(packet.blastRadius.files).toBeDefined();
    expect(packet.blastRadius.packages).toBeDefined();
    expect(packet.blastRadius.routes).toBeDefined();
  }, 30000);
});
