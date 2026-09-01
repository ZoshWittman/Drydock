'use client';

export default function ExportButton({ packetId }: { packetId: string }) {
  const handleExport = async () => {
    const response = await fetch(`/api/export/${packetId}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ship-packet-${packetId}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <button className="button" onClick={handleExport}>
      Export HTML
    </button>
  );
}
