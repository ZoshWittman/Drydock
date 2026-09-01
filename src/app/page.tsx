import Link from 'next/link';
import { listShipPackets } from '@/db/repository';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  const packets = listShipPackets(50);

  return (
    <>
      <div className="header">
        <div className="container">
          <h1>🚢 Drydock</h1>
          <p>Ship-acceptance studio for agent-authored PRs</p>
        </div>
      </div>

      <div className="container">
        <h2 style={{ marginBottom: '1.5rem' }}>Ship Packets</h2>

        {packets.length === 0 ? (
          <div className="card">
            <p style={{ color: '#6b7280' }}>
              No ship packets yet. Run <code>npm run accept -- &lt;repo-path&gt;</code> to create one.
            </p>
          </div>
        ) : (
          packets.map((packet) => (
            <Link key={packet.id} href={`/packet/${packet.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                      {packet.prTitle}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      by {packet.prAuthor} · {formatDistanceToNow(new Date(packet.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`verdict-badge verdict-${packet.verdict}`}>
                    {packet.verdict}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  <span>
                    Build: {packet.rebuild.success ? '✓' : '✗'}
                  </span>
                  <span>
                    Tests: {packet.testReplay.tests.length} ({packet.testReplay.success ? 'passed' : 'failed'})
                  </span>
                  <span>
                    Contracts: {packet.contracts.passed ? '✓' : '✗'}
                  </span>
                  <span>
                    Blast radius: {packet.blastRadius.score}
                  </span>
                </div>

                {packet.verdictReasons.length > 0 && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
                    <strong>Reasons:</strong> {packet.verdictReasons.join(', ')}
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
