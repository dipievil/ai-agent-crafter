import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

const locales = ['en', 'pt'] as const;
const defaultLocale = 'pt';

function isSupportedLocale(value: string): value is (typeof locales)[number] {
  return locales.includes(value as (typeof locales)[number]);
}

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale ?? defaultLocale;

  if (!isSupportedLocale(resolvedLocale)) notFound();

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default
  };
});