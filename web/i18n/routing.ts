// app/i18n/routing.ts

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['sv', 'en'],
  defaultLocale: 'sv'
});

export type Locale = (typeof routing.locales)[number];