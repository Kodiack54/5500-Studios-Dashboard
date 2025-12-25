'use client';

import { useEffect } from 'react';
import { AUTH_URL, DASHBOARD_PORT } from '@/lib/auth-client';

export default function LoginPage() {
  useEffect(() => {
    // Redirect to auth-7000 login with redirect back to this dashboard
    window.location.href = `${AUTH_URL}/login?redirect=${DASHBOARD_PORT}`;
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Redirecting to login...</p>
      </div>
    </div>
  );
}
