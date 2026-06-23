import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/login-form";
import { renderWithProviders } from "@/test/render-with-providers";

const pushMock = vi.fn();
const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.stubGlobal("fetch", fetchMock);

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits valid credentials and redirects to /chat", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Username"), "admin");
    await userEvent.type(screen.getByLabelText("Password"), "tke2026");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", expect.any(Object));
      expect(pushMock).toHaveBeenCalledWith("/chat");
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });

  it("shows the server error when credentials are rejected", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "Invalid credentials",
      }),
    });

    renderWithProviders(<LoginForm />);

    await userEvent.type(screen.getByLabelText("Username"), "admin");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("disables the full form while the login request is pending", async () => {
    let resolveRequest:
      | ((value: { ok: boolean; json: () => Promise<{ success: true }> }) => void)
      | undefined;
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderWithProviders(<LoginForm />);

    const usernameInput = screen.getByLabelText("Username");
    const passwordInput = screen.getByLabelText("Password");

    await userEvent.type(usernameInput, "admin");
    await userEvent.type(passwordInput, "tke2026");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));

    expect(screen.getByRole("button", { name: "Logging in..." })).toBeDisabled();
    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    resolveRequest?.({
      ok: true,
      json: async () => ({
        success: true,
      }),
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/chat");
    });
  });
});
