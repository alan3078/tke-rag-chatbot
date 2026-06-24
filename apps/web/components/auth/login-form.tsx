"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMemo, useState } from "react";
import { z } from "zod";
import { postJson, ApiError, ERROR_I18N_MAP } from "@/services/api-client";
import { useI18n } from "@/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoginRequest, LoginResponse } from "@/types";
import { Loader2, LogIn, Check } from "lucide-react";

const LOGIN_ENDPOINT = "/api/auth/login";

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [succeeded, setSucceeded] = useState(false);

  const loginFormSchema = useMemo(
    () =>
      z.object({
        username: z.string().min(1, t("login.usernameRequired")),
        password: z.string().min(1, t("login.passwordRequired")),
      }),
    [t],
  );

  type LoginFormValues = z.infer<typeof loginFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: "", password: "" },
  });

  const loginMutation = useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (credentials) => postJson<LoginResponse, LoginRequest>(LOGIN_ENDPOINT, credentials),
    onSuccess: () => {
      setSucceeded(true);
      queryClient.invalidateQueries({ queryKey: ["session"] });
      router.push("/chat");
    },
  });

  const isDisabled = loginMutation.isPending || succeeded;

  return (
    <form
      onSubmit={handleSubmit((values) => {
        loginMutation.reset();
        loginMutation.mutate(values);
      })}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="username">{t("login.username")}</Label>
        <Input
          id="username"
          type="text"
          autoComplete="username"
          disabled={isDisabled}
          {...register("username")}
        />
        {errors.username && (
          <p className="text-sm text-destructive" role="alert">
            {errors.username.message}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("login.password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          disabled={isDisabled}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      {loginMutation.error && (
        <p
          className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {loginMutation.error instanceof ApiError && loginMutation.error.code
            ? t((ERROR_I18N_MAP[loginMutation.error.code] ?? "error.unknown") as Parameters<typeof t>[0])
            : t("error.unknown")}
        </p>
      )}
      <Button type="submit" disabled={isDisabled} className="w-full">
        {loginMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("login.submitting")}
          </>
        ) : succeeded ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            {t("login.submit")}
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-4 w-4" />
            {t("login.submit")}
          </>
        )}
      </Button>
    </form>
  );
}
