import Link from 'next/link';
import { getShipPacket } from '@/db/repository';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import ExportButton from './ExportButton';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PacketPage({ params }: Props) {
  const { id } = await params;
  const packet = getShipPacket(id);

  if (!packet) {
    notFound();
  }

  return (
    <>
      <div className="header">
        <div className="container">
          <Link href="/" className="back-link">← Back to inbox</Link>
          <h1 style={{ marginTop: '1rem' }}>Ship Packet: {packet.prTitle}</h1>
        </div>
      </div>

      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
            <div>
              <span className={`verdict-badge verdict-${packet.verdict}`}>
                {packet.verdict}
              </span>
              <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                Created {format(new Date(packet.createdAt), 'PPpp')}
              </p>
            </div>
            <ExportButton packetId={packet.id} />
          </div>

          <div className="grid">
            <div className="stat">
              <div className="stat-label">Author</div>
              <div className="stat-value" style={{ fontSize: '1.125rem' }}>{packet.prAuthor}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Repository</div>
              <div className="stat-value" style={{ fontSize: '1.125rem' }}>
                <code style={{ fontSize: '0.875rem' }}>{packet.repoPath.split('/').pop()}</code>
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Branches</div>
              <div className="stat-value" style={{ fontSize: '0.875rem' }}>
                {packet.baseBranch} ← {packet.headBranch}
              </div>
            </div>
          </div>

          {packet.verdictReasons.length > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f9fafb', borderRadius: '6px' }}>
              <strong>Verdict Reasons:</strong>
              <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                {packet.verdictReasons.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="section">
          <h2>🏗️ Rebuild</h2>
          <div className="card">
            <div className="grid">
              <div className="stat">
                <div className="stat-label">Status</div>
                <div className="stat-value" style={{ color: packet.rebuild.success ? '#10b981' : '#ef4444' }}>
                  {packet.rebuild.success ? '✓ Success' : '✗ Failed'}
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Exit Code</div>
                <div className="stat-value">{packet.rebuild.exitCode}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Duration</div>
                <div className="stat-value">{packet.rebuild.duration}ms</div>
              </div>
            </div>
            {packet.rebuild.stderr && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Error Output:</strong>
                <pre>{packet.rebuild.stderr}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <h2>🧪 Test Replay</h2>
          <div className="card">
            <div className="grid">
              <div className="stat">
                <div className="stat-label">Status</div>
                <div className="stat-value" style={{ color: packet.testReplay.success ? '#10b981' : '#ef4444' }}>
                  {packet.testReplay.success ? '✓ Passed' : '✗ Failed'}
                </div>
              </div>
              <div className="stat">
                <div className="stat-label">Tests</div>
                <div className="stat-value">{packet.testReplay.tests.length}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Duration</div>
                <div className="stat-value">{packet.testReplay.duration}ms</div>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <ul className="list">
                {packet.testReplay.tests.map((test, i) => (
                  <li key={i} className={`list-item ${test.status === 'pass' ? 'success' : 'error'}`}>
                    {test.status === 'pass' ? '✓' : '✗'} {test.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>💥 Blast Radius</h2>
          <div className="card">
            <div className="grid">
              <div className="stat">
                <div className="stat-label">Score</div>
                <div className="stat-value">{packet.blastRadius.score}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Files Changed</div>
                <div className="stat-value">{packet.blastRadius.files.length}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Packages</div>
                <div className="stat-value">{packet.blastRadius.packages.length}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Routes</div>
                <div className="stat-value">{packet.blastRadius.routes.length}</div>
              </div>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <strong>Changed Files:</strong>
              <ul className="list">
                {packet.blastRadius.files.map((file, i) => (
                  <li key={i} className="list-item">
                    <code>{file.path}</code> (+{file.additions} -{file.deletions})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="section">
          <h2>📋 Contracts</h2>
          <div className="card">
            <div style={{ marginBottom: '1rem' }}>
              <span className={`verdict-badge ${packet.contracts.passed ? 'verdict-MERGE' : 'verdict-BLOCK'}`}>
                {packet.contracts.passed ? 'Passed' : 'Failed'}
              </span>
            </div>

            {packet.contracts.requiredTests.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Required Tests:</strong>
                <ul className="list">
                  {packet.contracts.requiredTests.map((test, i) => (
                    <li key={i} className={`list-item ${test.found ? 'success' : 'error'}`}>
                      {test.found ? '✓' : '✗'} {test.pattern}
                      {test.matchedTests.length > 0 && (
                        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#6b7280' }}>
                          Matched: {test.matchedTests.join(', ')}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {packet.contracts.forbiddenPaths.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Forbidden Paths:</strong>
                <ul className="list">
                  {packet.contracts.forbiddenPaths.map((path, i) => (
                    <li key={i} className={`list-item ${path.violated ? 'error' : 'success'}`}>
                      {path.violated ? '✗' : '✓'} {path.pattern}
                      {path.violatedFiles.length > 0 && (
                        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#ef4444' }}>
                          Violated: {path.violatedFiles.join(', ')}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {packet.contracts.requiredDocs.length > 0 && (
              <div>
                <strong>Required Documentation:</strong>
                <ul className="list">
                  {packet.contracts.requiredDocs.map((doc, i) => (
                    <li key={i} className={`list-item ${doc.found ? 'success' : 'error'}`}>
                      {doc.found ? '✓' : '✗'} {doc.keyword}
                      {doc.locations.length > 0 && (
                        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', color: '#6b7280' }}>
                          Found in: {doc.locations.join(', ')}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <h2>👁️ Parallax</h2>
          <div className="card">
            <div style={{ marginBottom: '1rem' }}>
              <span className={`verdict-badge ${packet.parallax.hasConflicts ? 'verdict-NEEDS_EYES' : 'verdict-MERGE'}`}>
                {packet.parallax.hasConflicts ? 'Conflicts Detected' : 'No Conflicts'}
              </span>
            </div>

            {packet.parallax.claims.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Claims:</strong>
                <ul className="list">
                  {packet.parallax.claims.map((claim, i) => (
                    <li key={i} className={`list-item ${claim.verified ? 'success' : 'warning'}`}>
                      <div><strong>{claim.source}:</strong> {claim.statement}</div>
                      {claim.verified && (
                        <div style={{ fontSize: '0.875rem', color: '#10b981', marginTop: '0.25rem' }}>
                          ✓ Verified
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {packet.parallax.conflicts.length > 0 && (
              <div>
                <strong>Conflicts:</strong>
                <ul className="list">
                  {packet.parallax.conflicts.map((conflict, i) => (
                    <li key={i} className="list-item error">
                      <div><strong>{conflict.claim}</strong></div>
                      <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Severity: {conflict.severity}
                      </div>
                      <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                        Counter-evidence: {conflict.counterEvidence.join(', ')}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="section">
          <h2>🔗 Witness Chain</h2>
          <div className="card">
            <div style={{ marginBottom: '1rem' }}>
              <span className={`verdict-badge ${packet.witness.valid ? 'verdict-MERGE' : 'verdict-BLOCK'}`}>
                {packet.witness.valid ? 'Valid Chain' : 'Invalid Chain'}
              </span>
            </div>

            <ul className="list">
              {packet.witness.entries.map((entry, i) => (
                <li key={i} className="list-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <strong>{entry.tool}</strong> · {entry.action}
                      <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <code style={{ fontSize: '0.75rem' }}>{entry.hash}</code>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
