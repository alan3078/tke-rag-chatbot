import { Controller, Post, Get, Body, Res, Req, HttpCode, HttpStatus } from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "./auth.constants";
import { AppException } from "../common/app-exception";
import { ErrorCode } from "../common/error-codes";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { username, password } = loginDto;

    const user = await this.authService.validateCredentials(username, password);
    if (!user) {
      throw new AppException(ErrorCode.F0001, HttpStatus.UNAUTHORIZED);
    }

    const accessToken = await this.authService.createToken(user);

    // Also set as HttpOnly session cookie for browser-based flows
    res.cookie(SESSION_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE * 1000,
      path: "/",
    });

    return {
      success: true,
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    return { success: true };
  }

  @Get("session")
  async session(@Req() req: Request) {
    const token = req.cookies?.[SESSION_COOKIE];
    const sessionUser = await this.authService.verifyToken(token);

    if (sessionUser) {
      return { authenticated: true, user: sessionUser };
    }

    return { authenticated: false, user: null };
  }
}
