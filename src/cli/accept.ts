#!/usr/bin/env node
import { ShipPacketProcessor } from '@/modules/processor';
import { saveShipPacket } from '@/db/repository';
import path from 'path';

async function main() {
  const repoPath = process.argv[2];
  
  if (!repoPath) {
    console.error('Usage: npm run accept -- <repo-path>');
    process.exit(1);
  }

  const absolutePath = path.resolve(repoPath);
  
  console.log(`Processing ship packet for: ${absolutePath}`);
  
  const processor = new ShipPacketProcessor();
  
  try {
    const packet = await processor.process({
      repoPath: absolutePath,
      prTitle: 'CLI acceptance check',
      prAuthor: 'cli',
      prBody: 'Automated acceptance check for test fixture',
    });
    
    saveShipPacket(packet);
    
    console.log(`\nVerdict: ${packet.verdict}`);
    console.log(`Reasons: ${packet.verdictReasons.join(', ')}`);
    console.log(`\nBuild: ${packet.rebuild.success ? '✓' : '✗'}`);
    console.log(`Tests: ${packet.testReplay.success ? '✓' : '✗'} (${packet.testReplay.tests.length} tests)`);
    console.log(`Contracts: ${packet.contracts.passed ? '✓' : '✗'}`);
    console.log(`Blast radius score: ${packet.blastRadius.score}`);
    
    if (packet.verdict === 'MERGE') {
      console.log('\n✓ Ready to ship');
      process.exit(0);
    } else {
      console.log('\n✗ Blocked');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('Error processing ship packet:', error.message);
    process.exit(1);
  }
}

main();
