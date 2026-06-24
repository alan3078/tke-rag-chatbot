"use client";

import { useI18n } from "./i18n-provider";

export function I18nHtml({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { locale } = useI18n();

  return (
    <html lang={locale} className={className}>
      {children}
    </html>
  );
}
