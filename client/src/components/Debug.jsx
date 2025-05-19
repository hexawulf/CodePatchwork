import React from 'react';

export function DebugEnv() {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', margin: '20px', fontFamily: 'monospace' }}>
      <h2>Environment Variables Debug</h2>
      <ul>
        <li>VITE_FIREBASE_API_KEY: {import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Loaded' : '❌ Missing'}</li>
        <li>VITE_FIREBASE_AUTH_DOMAIN: {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? '✅ Loaded' : '❌ Missing'}</li>
        <li>VITE_FIREBASE_PROJECT_ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID ? '✅ Loaded' : '❌ Missing'}</li>
        <li>VITE_FIREBASE_STORAGE_BUCKET: {import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? '✅ Loaded' : '❌ Missing'}</li>
        <li>VITE_FIREBASE_MESSAGING_SENDER_ID: {import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? '✅ Loaded' : '❌ Missing'}</li>
        <li>VITE_FIREBASE_APP_ID: {import.meta.env.VITE_FIREBASE_APP_ID ? '✅ Loaded' : '❌ Missing'}</li>
        <li>VITE_FIREBASE_MEASUREMENT_ID: {import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ? '✅ Loaded' : '❌ Missing'}</li>
      </ul>
      <p>Note: For security, actual values are not displayed.</p>
      
      <h3>API Key Check</h3>
      <p>First 4 characters of API Key: {import.meta.env.VITE_FIREBASE_API_KEY ? import.meta.env.VITE_FIREBASE_API_KEY.substring(0, 4) + '...' : 'Missing'}</p>
    </div>
  );
}
