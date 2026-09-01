import { getShipPacket } from '@/db/repository';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const packet = getShipPacket(id);

  if (!packet) {
    return new NextResponse('Not found', { status: 404 });
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ship Packet: ${packet.prTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .header { background: #1a1a1a; color: white; padding: 2rem; margin-bottom: 2rem; }
    .card { background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .verdict-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; }
    .verdict-MERGE { background: #10b981; color: white; }
    .verdict-BLOCK { background: #ef4444; color: white; }
    .verdict-NEEDS_EYES { background: #f59e0b; color: white; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin: 1rem 0; }
    .stat { background: #f9fafb; padding: 1rem; border-radius: 6px; }
    .stat-label { font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: 600; }
    .section { margin-top: 2rem; }
    .section h2 { margin-bottom: 1rem; }
    .list { list-style: none; }
    .list-item { padding: 0.75rem; border-left: 3px solid #e5e5e5; margin-bottom: 0.5rem; background: #f9fafb; }
    .list-item.success { border-left-color: #10b981; }
    .list-item.error { border-left-color: #ef4444; }
    code { background: #1a1a1a; color: #fff; padding: 0.125rem 0.375rem; border-radius: 3px; font-size: 0.875rem; }
    pre { background: #1a1a1a; color: #fff; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚢 Drydock Ship Packet</h1>
    <h2 style="margin-top: 1rem;">${packet.prTitle}</h2>
  </div>
  
  <div class="container">
    <div class="card">
      <span class="verdict-badge verdict-${packet.verdict}">${packet.verdict}</span>
      <p style="margin-top: 1rem; color: #6b7280;">Created ${new Date(packet.createdAt).toLocaleString()}</p>
      
      <div class="grid" style="margin-top: 1.5rem;">
        <div class="stat">
          <div class="stat-label">Author</div>
          <div class="stat-value" style="font-size: 1.125rem;">${packet.prAuthor}</div>
        </div>
        <div class="stat">
          <div class="stat-label">Repository</div>
          <div class="stat-value" style="font-size: 1.125rem;"><code>${packet.repoPath.split('/').pop()}</code></div>
        </div>
      </div>
      
      ${packet.verdictReasons.length > 0 ? `
        <div style="margin-top: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 6px;">
          <strong>Verdict Reasons:</strong>
          <ul style="margin-top: 0.5rem; margin-left: 1.5rem;">
            ${packet.verdictReasons.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
    
    <div class="section">
      <h2>🏗️ Rebuild</h2>
      <div class="card">
        <div class="grid">
          <div class="stat">
            <div class="stat-label">Status</div>
            <div class="stat-value" style="color: ${packet.rebuild.success ? '#10b981' : '#ef4444'};">
              ${packet.rebuild.success ? '✓ Success' : '✗ Failed'}
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">Duration</div>
            <div class="stat-value">${packet.rebuild.duration}ms</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>🧪 Test Replay</h2>
      <div class="card">
        <div class="grid">
          <div class="stat">
            <div class="stat-label">Status</div>
            <div class="stat-value" style="color: ${packet.testReplay.success ? '#10b981' : '#ef4444'};">
              ${packet.testReplay.success ? '✓ Passed' : '✗ Failed'}
            </div>
          </div>
          <div class="stat">
            <div class="stat-label">Tests</div>
            <div class="stat-value">${packet.testReplay.tests.length}</div>
          </div>
        </div>
        <ul class="list" style="margin-top: 1rem;">
          ${packet.testReplay.tests.map(t => `
            <li class="list-item ${t.status === 'pass' ? 'success' : 'error'}">
              ${t.status === 'pass' ? '✓' : '✗'} ${t.name}
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
    
    <div class="section">
      <h2>💥 Blast Radius</h2>
      <div class="card">
        <div class="grid">
          <div class="stat">
            <div class="stat-label">Score</div>
            <div class="stat-value">${packet.blastRadius.score}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Files</div>
            <div class="stat-value">${packet.blastRadius.files.length}</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>📋 Contracts</h2>
      <div class="card">
        <span class="verdict-badge ${packet.contracts.passed ? 'verdict-MERGE' : 'verdict-BLOCK'}">
          ${packet.contracts.passed ? 'Passed' : 'Failed'}
        </span>
      </div>
    </div>
    
    <div class="section">
      <h2>🔗 Witness Chain</h2>
      <div class="card">
        <span class="verdict-badge ${packet.witness.valid ? 'verdict-MERGE' : 'verdict-BLOCK'}">
          ${packet.witness.valid ? 'Valid' : 'Invalid'}
        </span>
        <p style="margin-top: 1rem;">${packet.witness.entries.length} entries recorded</p>
      </div>
    </div>
    
    <div class="section">
      <h3>Raw JSON</h3>
      <pre>${JSON.stringify(packet, null, 2)}</pre>
    </div>
  </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="ship-packet-${id}.html"`,
    },
  });
}
