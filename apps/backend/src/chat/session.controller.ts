import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Request } from "express";
import { IsString, IsOptional, IsNotEmpty } from "class-validator";
import { AuthGuard } from "../auth/auth.guard";
import { SessionService } from "./session.service";

class CreateSessionDto {
  @IsString()
  @IsOptional()
  title?: string;
}

class UpdateTitleDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
}

@Controller("sessions")
@UseGuards(AuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  async list(@Req() req: Request) {
    const userId = req.user!.id;
    return this.sessionService.listSessions(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Req() req: Request, @Body() body: CreateSessionDto) {
    const userId = req.user!.id;
    const session = await this.sessionService.createSession(userId, body.title);
    return { id: session.id, title: session.title, createdAt: session.createdAt };
  }

  @Get(":id")
  async get(@Req() req: Request, @Param("id") id: string) {
    const userId = req.user!.id;
    return this.sessionService.getSession(userId, id);
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  async updateTitle(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: UpdateTitleDto,
  ) {
    const userId = req.user!.id;
    await this.sessionService.updateSessionTitle(userId, id, body.title);
    return { success: true };
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  async delete(@Req() req: Request, @Param("id") id: string) {
    const userId = req.user!.id;
    await this.sessionService.deleteSession(userId, id);
    return { success: true };
  }
}
