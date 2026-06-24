import { Controller, Post, Body, Req, UseGuards, HttpCode, HttpStatus } from "@nestjs/common";
import { Request } from "express";
import { IsString, IsNotEmpty, IsOptional, IsUUID } from "class-validator";
import { ChatService } from "./chat.service";
import { AuthGuard } from "../auth/auth.guard";
import { ChatResponse } from "./dto/chat-request.dto";

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  /** If provided, appends to an existing session. Otherwise creates a new session. */
  @IsUUID()
  @IsOptional()
  sessionId?: string;

  /** Optional locale hint for system prompt selection */
  @IsString()
  @IsOptional()
  locale?: string;
}

@Controller("chat")
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async chat(
    @Req() req: Request,
    @Body() body: ChatRequestDto,
  ): Promise<ChatResponse & { sessionId: string }> {
    const userId = req.user!.id;
    return this.chatService.ragQuery(userId, body.message, body.sessionId, body.locale);
  }
}
