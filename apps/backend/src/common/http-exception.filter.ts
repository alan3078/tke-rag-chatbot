import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from "@nestjs/common";
import { Response } from "express";
import { AppException } from "./app-exception";
import { ErrorCode } from "./error-codes";

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    if (exception instanceof AppException) {
      return response.status(status).json({
        code: exception.code,
        statusCode: status,
      });
    }

    if (status === 400) {
      return response.status(status).json({
        code: ErrorCode.F0003,
        statusCode: status,
      });
    }

    if (status === 401) {
      return response.status(status).json({
        code: ErrorCode.F0002,
        statusCode: status,
      });
    }

    if (status === 429) {
      return response.status(status).json({
        code: ErrorCode.F0009,
        statusCode: status,
      });
    }

    return response.status(status).json({
      code: ErrorCode.F0007,
      statusCode: status,
    });
  }
}
