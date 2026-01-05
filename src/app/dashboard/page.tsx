'use client';

import UniversalDashboard from '@/components/UniversalDashboard';
import { useOtherAutoFlip } from '@/app/hooks/useContextAutoFlip';

export default function DashboardPage() {
  // Auto-flip to OTHER mode - dashboard is admin/personal, no Claude tracking
  useOtherAutoFlip();

  return <UniversalDashboard />;
}
