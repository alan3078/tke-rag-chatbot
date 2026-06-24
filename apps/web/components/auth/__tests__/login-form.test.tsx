import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/auth/login-form";
import { renderWithProviders } from "@/test/render-with-providers";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits valid credentials and redirects to /chat", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText("用户名"), "admin");
    await userEvent.type(screen.getByLabelText("密码"), "tke2026");
    await userEvent.click(screen.getByRole("button", { name: /登录/ }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", expect.any(Object));
      expect(pushMock).toHaveBeenCalledWith("/chat");
    });
  });

  it("shows the server error when credentials are rejected", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ code: "F0001", statusCode: 401 }),
    });

    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText("用户名"), "admin");
    await userEvent.type(screen.getByLabelText("密码"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /登录/ }));

    expect(await screen.findByText("用户名或密码错误")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("disables the full form while the login request is pending", async () => {
    let resolveRequest: ((value: { ok: boolean; json: () => Promise<unknown> }) => void) | undefined;
    fetchMock.mockReturnValue(
      new Promise((resolve) => { resolveRequest = resolve; }),
    );

    renderWithProviders(<LoginForm />);

    const usernameInput = screen.getByLabelText("用户名");
    const passwordInput = screen.getByLabelText("密码");

    await userEvent.type(usernameInput, "admin");
    await userEvent.type(passwordInput, "tke2026");
    await userEvent.click(screen.getByRole("button", { name: /登录/ }));

    expect(screen.getByRole("button", { name: /登录中/ })).toBeDisabled();
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    resolveRequest?.({ ok: true, json: async () => ({ success: true }) });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/chat");
    });
  });
});
