'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

// Fallback messages in case translations fail
const fallbackMessages = {
  title: 'Page not found',
  message: 'Sorry, the page you are looking for does not exist.',
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

export function NotFoundContent() {
  const [translations, setTranslations] = useState(fallbackMessages);
  
  // Always call hook (React rules)
  const t = useTranslations('notFound');

  useEffect(() => {
    // Try to get translations, fallback to defaults if they fail
    try {
      setTranslations({
        title: safeTranslate(t, 'title', fallbackMessages.title),
        message: safeTranslate(t, 'message', fallbackMessages.message),
        backHome: safeTranslate(t, 'backHome', fallbackMessages.backHome)
      });
    } catch (err) {
      console.warn('Error updating translations, keeping fallbacks:', err);
      // Keep fallback messages
    }
  }, [t]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardContent className="py-12 text-center">
          <div className="text-6xl font-bold text-neutral-300 mb-4">404</div>
          <h1 className="text-2xl font-semibold mb-2">{translations.title}</h1>
          <p className="text-neutral-600 mb-6">{translations.message}</p>
          <Link href="/">
            <Button>{translations.backHome}</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

