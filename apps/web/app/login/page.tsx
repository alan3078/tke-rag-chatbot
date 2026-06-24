"use client";

import { motion } from "framer-motion";
import { LoginForm } from "@/components/auth/login-form";
import { LanguageSwitcher } from "@/components/auth/language-switcher";
import { useI18n } from "@/providers/i18n-provider";
import { Shield, Globe, FileText } from "lucide-react";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function LoginPage() {
  const { t } = useI18n();

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-background text-foreground">
      <div className="absolute right-6 top-6 z-10">
        <LanguageSwitcher />
      </div>

      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <motion.section
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-primary/5 lg:grid-cols-[1fr_1fr]"
        >
          {/* Left panel — brand */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="flex flex-col justify-between bg-primary p-10 text-primary-foreground lg:p-12"
          >
            <div>
              <motion.div variants={fadeIn} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-foreground/10">
                  <Shield className="h-5 w-5" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-yellow-400/90">
                  {t("tkeTag")}
                </p>
              </motion.div>
              <motion.h1
                variants={fadeIn}
                className="mt-10 text-4xl font-bold leading-tight tracking-tight"
              >
                {t("app.title")}
              </motion.h1>
              <motion.p
                variants={fadeIn}
                className="mt-4 max-w-sm text-base leading-7 text-primary-foreground/75"
              >
                {t("login.description")}
              </motion.p>
            </div>

            <motion.div variants={stagger} className="mt-12 grid gap-4">
              <motion.div
                variants={fadeIn}
                className="flex items-start gap-4 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-4"
              >
                <Globe className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400/80" />
                <div>
                  <p className="font-semibold">{t("login.bilingual")}</p>
                  <p className="mt-1 text-sm leading-6 text-primary-foreground/60">
                    {t("login.bilingualDesc")}
                  </p>
                </div>
              </motion.div>
              <motion.div
                variants={fadeIn}
                className="flex items-start gap-4 rounded-2xl border border-primary-foreground/10 bg-primary-foreground/5 p-4"
              >
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400/80" />
                <div>
                  <p className="font-semibold">{t("login.sourceBacked")}</p>
                  <p className="mt-1 text-sm leading-6 text-primary-foreground/60">
                    {t("login.sourceBackedDesc")}
                  </p>
                </div>
              </motion.div>
            </motion.div>

            <motion.p
              variants={fadeIn}
              className="mt-10 text-xs text-primary-foreground/40"
            >
              Tsinghua School of Software · RAG Chatbot
            </motion.p>
          </motion.div>

          {/* Right panel — form */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="flex flex-col justify-center px-10 py-14 lg:px-14"
          >
            <motion.div variants={fadeIn} className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {t("login.secureTitle")}
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                {t("login.subtitle")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t("login.subtitleDesc")}
              </p>
            </motion.div>
            <motion.div variants={fadeIn}>
              <LoginForm />
            </motion.div>
          </motion.div>
        </motion.section>
      </div>
    </main>
  );
}
