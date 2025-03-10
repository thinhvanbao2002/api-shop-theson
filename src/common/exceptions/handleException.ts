import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import {
	Catch,
	HttpException,
	HttpStatus,
	InternalServerErrorException,
	UnprocessableEntityException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	constructor(public reflector: Reflector) {}

	catch(exception: unknown, host: ArgumentsHost) {
		console.log("🚀 ~ HttpExceptionFilter ~ exception:", exception);
		if (exception instanceof HttpException) {
			return this.handleHttpException(exception, host);
		}

		const error =
			exception instanceof Error
				? new InternalServerErrorException({
						cause: exception,
					})
				: new UnprocessableEntityException(exception);
		const stack = exception instanceof Error ? exception.stack : error.stack;
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
			message: "Có lỗi xảy ra. Vui lòng thử lại",
			errors: error,
			code: HttpStatus.INTERNAL_SERVER_ERROR,
			...(Number(process.env.STACK_TRACE_ENABLE) && { stack }),
			timestamp: Date.now(),
			status: false,
		});
	}

	handleHttpException(exception: HttpException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		const status = Number(exception.getStatus());

		const errorResponse: { errors: any } = { errors: null };
		const originResponse = exception.getResponse();

		if (typeof originResponse === "object") {
			const r = originResponse as { message: any; error: any; errors: any };
			errorResponse.errors = r.errors || r.message;
		} else {
			errorResponse.errors = originResponse;
		}

		response.status(status).json({
			message:
				status === HttpStatus.INTERNAL_SERVER_ERROR.valueOf()
					? "Error. Please try again later"
					: exception.message,
			errors: errorResponse.errors,
			code: status,
			...(Number(process.env.STACK_TRACE_ENABLE) && { stack: exception.stack }),
			timestamp: Date.now(),
			status: false,
		});
	}
}
