"use client";

import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { postJson } from "@/lib/api-client";
import type { LoginRequest, LoginResponse } from "@/types";

const LOGIN_FORM_SCHEMA = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof LOGIN_FORM_SCHEMA>;

const LOGIN_ENDPOINT = "/api/auth/login";
const USERNAME_FIELD = "username";
const PASSWORD_FIELD = "password";
const LOGIN_BUTTON_LABEL = "Login";
const LOGIN_PENDING_LABEL = "Logging in...";

export function LoginForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(LOGIN_FORM_SCHEMA),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (credentials) => postJson<LoginResponse, LoginRequest>(LOGIN_ENDPOINT, credentials),
    onSuccess: () => {
      router.push("/chat");
      router.refresh();
    },
  });

  const isSubmitting = loginMutation.isPending;
  const submissionError = loginMutation.error?.message ?? "";
  const onSubmit = handleSubmit((values) => {
    loginMutation.reset();
    loginMutation.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor={USERNAME_FIELD}
          className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500"
        >
          Username
        </label>
        <input
          id={USERNAME_FIELD}
          type="text"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#7A1F2B]/30"
          autoComplete="username"
          disabled={isSubmitting}
          {...register(USERNAME_FIELD)}
        />
        {errors.username && (
          <p className="text-sm text-red-700" role="alert">
            {errors.username.message}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <label
          htmlFor={PASSWORD_FIELD}
          className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500"
        >
          Password
        </label>
        <input
          id={PASSWORD_FIELD}
          type="password"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-[#7A1F2B]/30"
          autoComplete="current-password"
          disabled={isSubmitting}
          {...register(PASSWORD_FIELD)}
        />
        {errors.password && (
          <p className="text-sm text-red-700" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      {submissionError && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {submissionError}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-[#7A1F2B] px-4 py-3 text-sm font-semibold tracking-[0.08em] text-white transition hover:bg-[#651a24] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? LOGIN_PENDING_LABEL : LOGIN_BUTTON_LABEL}
      </button>
    </form>
  );
}
