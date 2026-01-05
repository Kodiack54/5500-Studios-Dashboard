'use client';

/**
 * ContextToast - Shows toast notifications when context changes
 *
 * Displays messages like:
 * - "Context → Forge"
 * - "Context → Studios Platform (dev1)"
 * - "Context → Helpdesk"
 */

import { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useUserContext } from '@/app/contexts/UserContextProvider';

export default function ContextToast() {
  const { toastMessage, clearToast } = useUserContext();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toastMessage) {
      setVisible(true);

      // Auto-hide after 2.5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(clearToast, 300); // Wait for fade out animation
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [toastMessage, clearToast]);

  if (!toastMessage) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[110] transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
        <div className="flex items-center gap-2 text-orange-400">
          <ArrowRight className="w-4 h-4" />
        </div>
        <span className="text-white font-medium">{toastMessage}</span>
        <CheckCircle className="w-4 h-4 text-green-400" />
      </div>
    </div>
  );
}
