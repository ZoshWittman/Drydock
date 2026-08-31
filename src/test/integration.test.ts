import { describe, it, expect } from 'vitest';
import { ShipPacketProcessor } from '@/modules/processor';
import { saveShipPacket, getShipPacket, listShipPackets } from '@/db/repository';
import path from 'path';

describe('Integration Tests', () => {
  it('should save and retrieve ship packet', async () => {
    const processor = new ShipPacketProcessor();
    const fixturePath = path.join(process.cwd(), 'fixtures/good-pr');
    
    const packet = await processor.process({
      repoPath: fixturePath,
      prTitle: 'Integration Test',
      prAuthor: 'tester',
      prBody: 'Test',
    });
    
    saveShipPacket(packet);
    
    const retrieved = getShipPacket(packet.id);
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(packet.id);
    expect(retrieved?.verdict).toBe(packet.verdict);
  }, 30000);

  it('should list ship packets', async () => {
    const processor = new ShipPacketProcessor();
    const fixturePath = path.join(process.cwd(), 'fixtures/good-pr');
    
    const packet1 = await processor.process({
      repoPath: fixturePath,
      prTitle: 'Test 1',
      prAuthor: 'tester',
      prBody: 'Test',
    });
    
    const packet2 = await processor.process({
      repoPath: fixturePath,
      prTitle: 'Test 2',
      prAuthor: 'tester',
      prBody: 'Test',
    });
    
    saveShipPacket(packet1);
    saveShipPacket(packet2);
    
    const packets = listShipPackets(10);
    
    expect(packets.length).toBeGreaterThanOrEqual(2);
  }, 60000);

  it('should differentiate MERGE vs BLOCK verdicts', async () => {
    const processor = new ShipPacketProcessor();
    
    const goodPath = path.join(process.cwd(), 'fixtures/good-pr');
    const badPath = path.join(process.cwd(), 'fixtures/bad-pr');
    
    const goodPacket = await processor.process({
      repoPath: goodPath,
      prTitle: 'Good PR',
      prAuthor: 'tester',
      prBody: 'fixture',
    });
    
    const badPacket = await processor.process({
      repoPath: badPath,
      prTitle: 'Bad PR',
      prAuthor: 'tester',
      prBody: 'Test',
    });
    
    expect(goodPacket.verdict).toBe('MERGE');
    expect(badPacket.verdict).toBe('BLOCK');
    
    expect(goodPacket.rebuild.success).toBe(true);
    expect(badPacket.rebuild.success).toBe(false);
  }, 60000);
});
