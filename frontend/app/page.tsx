'use client';

import React, { useState } from 'react';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: 'Failed to analyze.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-4 bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold">WordPress Diagnostic Tool</h1>
      <input
        className="w-full p-2 border rounded"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        onClick={handleAnalyze}
        disabled={loading}
      >
        {loading ? 'Analyzing...' : 'Analyze Website'}
      </button>

      {result && (
  <div className="bg-white p-4 rounded space-y-4 text-sm">
    {result.error && <div className="text-red-600">{result.error}</div>}
    {result.summary && (
      <pre className="bg-gray-900 text-white p-4 rounded overflow-x-auto">
        {JSON.stringify(result.summary, null, 2)}
      </pre>
    )}
    {result.bottlenecks && (
      <pre className="bg-gray-900 text-white p-4 rounded overflow-x-auto">
        {JSON.stringify(result.bottlenecks, null, 2)}
      </pre>
    )}
    {result.resources && (
      <pre className="bg-gray-900 text-white p-4 rounded overflow-x-auto">
        {JSON.stringify(result.resources, null, 2)}
      </pre>
    )}
  </div>
)}

    </main>
  );
}
