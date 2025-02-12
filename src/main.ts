import { NestFactory, Reflector } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpStatus, ValidationPipe, VersioningType } from "@nestjs/common";
import { HttpResponseInterceptor } from "./common/interceptors/handleresponse.interceptor";
import { HttpExceptionFilter } from "./common/exceptions/handleException";
import { ExpressAdapter, NestExpressApplication } from "@nestjs/platform-express";
import { setupSwagger } from "./bootstrap/setup-swagger";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule, new ExpressAdapter(), {
		cors: true,
	});
	app.enableVersioning();
	const reflector = app.get(Reflector);
	app.useGlobalFilters(
		// new BadRequestFilter(reflector),
		// new QueryFailedFilter(reflector),
		new HttpExceptionFilter(reflector),
	);
	app.useGlobalPipes(
		new ValidationPipe({
			//whitelist: true,
			errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
			transform: true,
			dismissDefaultMessages: false,
			enableDebugMessages: true,
			// transform: true,
			// validateCustomDecorators: true,
			// forbidNonWhitelisted: false,
			// forbidUnknownValues: false,
			// whitelist: true,
			transformOptions: {
				enableImplicitConversion: true,
			},
		}),
	);
	app.useGlobalInterceptors(new HttpResponseInterceptor());
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: ["1"],
		prefix: "api/v",
	});

	setupSwagger(app); // Call setupSwagger with the app instance

	await app.listen(3009);

	return app;
}

bootstrap();
