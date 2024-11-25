import type { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { PageDto } from "../dto/page.dto";
import { PagedResponseDto, ResponseDto } from "../dto/response.dto";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";
@Injectable()
export class HttpResponseInterceptor<T> implements NestInterceptor<T> {
	/**
	 * Intercept the request and add the timestamp
	 * @param context {ExecutionContext}
	 * @param next {CallHandler}
	 * @returns { payload:Response<T>, timestamp: string }
	 */
	intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
		return next.handle().pipe(
			map(data => {
				if (data instanceof PageDto) {
					return new PagedResponseDto(data, 200);
				}

				return new ResponseDto(data, 200);
			}),
		);
	}
}
