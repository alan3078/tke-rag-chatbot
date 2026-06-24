"use client";

import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const next: Locale = locale === "zh-CN" ? "en" : "zh-CN";
  const label = locale === "zh-CN" ? "EN" : "中文";

  return (
    <Button variant="outline" size="sm" onClick={() => setLocale(next)}>
      <Languages className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
