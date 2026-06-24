import { Injectable, CanActivate, ExecutionContext, HttpStatus } from "@nestjs/common";
import { Request } from "express";
import { AuthService, SessionUser } from "./auth.service";
import { SESSION_COOKIE } from "./auth.constants";
import { AppException } from "../common/app-exception";
import { ErrorCode } from "../common/error-codes";

/** Augment Express Request to carry the authenticated user */
declare module "express" {
  interface Request {
    user?: SessionUser;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Accept token from cookie OR Authorization: Bearer <token> header
    const cookieToken: string | undefined = request.cookies?.[SESSION_COOKIE];
    const headerToken = this.extractBearerToken(request);
    const token = cookieToken ?? headerToken;

    const sessionUser = await this.authService.verifyToken(token);
    if (!sessionUser) {
      throw new AppException(ErrorCode.F0002, HttpStatus.UNAUTHORIZED);
    }

    request.user = sessionUser;
    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return undefined;
    return authHeader.slice(7);
  }
}
