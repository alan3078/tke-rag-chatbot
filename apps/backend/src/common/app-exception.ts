import { HttpException, HttpStatus } from "@nestjs/common";
import { ErrorCode } from "./error-codes";

export class AppException extends HttpException {
  readonly code: ErrorCode;

  constructor(code: ErrorCode, httpStatus: HttpStatus) {
    super({ code }, httpStatus);
    this.code = code;
  }
}
