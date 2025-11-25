'use client';

import { useEffect } from 'react';
import { ErrorContent } from '@/components/ErrorContent';

export default function ProjectSlugError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Project Slug Error:', error);
  }, [error]);

  return <ErrorContent error={error} reset={reset} />;
}



