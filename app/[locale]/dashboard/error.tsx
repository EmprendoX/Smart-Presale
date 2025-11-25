'use client';

import { useEffect } from 'react';
import { ErrorContent } from '@/components/ErrorContent';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return <ErrorContent error={error} reset={reset} />;
}



