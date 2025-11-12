'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

// Fallback messages in case translations fail
const fallbackMessages = {
  title: 'Something went wrong',
  message: 'An unexpected error occurred. Please try again.',
  reload: 'Reload page',
  backHome: 'Back to home'
};

function safeTranslate(t: (key: string) => string, key: string, fallback: string): string {
  try {
    const result = t(key);
    return result || fallback;
  } catch (err) {
    console.warn(`Translation error for key "${key}", using fallback:`, err);
    return fallback;
  }
}

export function ErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [translations, setTranslations] = useState(fallbackMessages);
  
  // Always call hook (React rules)
  const t = useTranslations('error');

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error);

    // Try to get translations, fallback to defaults if they fail
    try {
      setTranslations({
        title: safeTranslate(t, 'title', fallbackMessages.title),
        message: safeTranslate(t, 'message', fallbackMessages.message),
        reload: safeTranslate(t, 'reload', fallbackMessages.reload),
        backHome: safeTranslate(t, 'backHome', fallbackMessages.backHome)
      });
    } catch (err) {
      console.warn('Error updating translations, keeping fallbacks:', err);
      // Keep fallback messages
    }
  }, [error, t]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-semibold mb-2">{translations.title}</h1>
          <p className="text-neutral-600 mb-6">{translations.message}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={reset}>{translations.reload}</Button>
            <Link href="/">
              <Button variant="secondary">{translations.backHome}</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

