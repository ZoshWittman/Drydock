import { getDatabase } from './schema';
import type { ShipPacket } from '@/types';

export function saveShipPacket(packet: ShipPacket): void {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ship_packets (
      id, pr_url, pr_number, pr_title, pr_author, repo_path,
      base_branch, head_branch, verdict, verdict_reasons,
      created_at, updated_at,
      rebuild_data, test_replay_data, blast_radius_data,
      contracts_data, witness_data, parallax_data
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    packet.id,
    packet.prUrl,
    packet.prNumber,
    packet.prTitle,
    packet.prAuthor,
    packet.repoPath,
    packet.baseBranch,
    packet.headBranch,
    packet.verdict,
    JSON.stringify(packet.verdictReasons),
    packet.createdAt,
    packet.updatedAt,
    JSON.stringify(packet.rebuild),
    JSON.stringify(packet.testReplay),
    JSON.stringify(packet.blastRadius),
    JSON.stringify(packet.contracts),
    JSON.stringify(packet.witness),
    JSON.stringify(packet.parallax)
  );
}

export function getShipPacket(id: string): ShipPacket | null {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT * FROM ship_packets WHERE id = ?
  `);
  
  const row = stmt.get(id) as any;
  if (!row) return null;
  
  return {
    id: row.id,
    prUrl: row.pr_url,
    prNumber: row.pr_number,
    prTitle: row.pr_title,
    prAuthor: row.pr_author,
    repoPath: row.repo_path,
    baseBranch: row.base_branch,
    headBranch: row.head_branch,
    verdict: row.verdict,
    verdictReasons: JSON.parse(row.verdict_reasons),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rebuild: JSON.parse(row.rebuild_data),
    testReplay: JSON.parse(row.test_replay_data),
    blastRadius: JSON.parse(row.blast_radius_data),
    contracts: JSON.parse(row.contracts_data),
    witness: JSON.parse(row.witness_data),
    parallax: JSON.parse(row.parallax_data),
  };
}

export function listShipPackets(limit = 50): ShipPacket[] {
  const db = getDatabase();
  
  const stmt = db.prepare(`
    SELECT * FROM ship_packets 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  
  const rows = stmt.all(limit) as any[];
  
  return rows.map(row => ({
    id: row.id,
    prUrl: row.pr_url,
    prNumber: row.pr_number,
    prTitle: row.pr_title,
    prAuthor: row.pr_author,
    repoPath: row.repo_path,
    baseBranch: row.base_branch,
    headBranch: row.head_branch,
    verdict: row.verdict,
    verdictReasons: JSON.parse(row.verdict_reasons),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    rebuild: JSON.parse(row.rebuild_data),
    testReplay: JSON.parse(row.test_replay_data),
    blastRadius: JSON.parse(row.blast_radius_data),
    contracts: JSON.parse(row.contracts_data),
    witness: JSON.parse(row.witness_data),
    parallax: JSON.parse(row.parallax_data),
  }));
}
