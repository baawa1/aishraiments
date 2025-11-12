"use client";

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            backgroundColor: 'white'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              color: '#dc2626'
            }}>
              Application Error
            </h2>
            <p style={{
              marginBottom: '1rem',
              color: '#6b7280'
            }}>
              A critical error occurred. Please refresh the page to try again.
            </p>
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '0.75rem',
              borderRadius: '0.25rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              overflowX: 'auto'
            }}>
              <p style={{ color: '#dc2626', fontWeight: 600 }}>Error:</p>
              <p style={{ color: '#374151' }}>{error.message}</p>
            </div>
            <button
              onClick={reset}
              style={{
                width: '100%',
                padding: '0.5rem 1rem',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.25rem',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
