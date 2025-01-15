import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UploadModule } from "./modules/upload/upload.module";
import { UserModule } from "./modules/user/user.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { join } from "path";
import { CustomerModule } from "./modules/customer/customer.module";
import { AdminModule } from "./modules/admin/admin.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { CustomerInfoModule } from "./modules/customer-info/customer-info.module";
import { NewModule } from "./modules/new/new.module";
import { AuthModule } from "./modules/auth/auth.module";
import { CategoryModule } from "./modules/category/category.module";
import { ProductModule } from "./modules/product/product.module";
import { ProductPhotoModule } from "./modules/product-photo/product-photo.module";
import { OrderModule } from "./modules/order/order.module";
import { OrderDetailModule } from "./modules/order-detail/order-detail.module";
import { CartModule } from "./modules/cart/cart.module";
import { OverviewModule } from "./modules/overview/overview.module";
import { WebsocketModule } from "./modules/websocket/websocket.module";
import { TransactionModule } from "./modules/transaction/transaction.module";
import { BlogModule } from "./modules/blog/blog.module";
import { ProductReviewModule } from "./modules/product-review/product-review.module";

@Module({
	imports: [
		ServeStaticModule.forRoot({
			rootPath: join(__dirname, "..", "./uploads"),
			serveRoot: "/api/v1/uploads/",
		}),
		ConfigModule.forRoot(),
		SequelizeModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				dialect: "mysql",
				host: configService.get("DB_HOST"),
				port: +configService.get("DB_PORT"),
				username: configService.get("DB_USERNAME"),
				password: configService.get("DB_PASSWORD"),
				database: configService.get("DB_DATABASE"),
				models: [join(process.cwd(), "dist/modules/*.model.js")],
				autoLoadModels: true,
				synchronize: true,
				sync: {
					alter: true,
				},
			}),
			inject: [ConfigService],
		}),
		UploadModule,
		UserModule,
		CustomerModule,
		AdminModule,
		NotificationModule,
		CustomerInfoModule,
		NewModule,
		AuthModule,
		CategoryModule,
		ProductModule,
		ProductPhotoModule,
		OrderModule,
		OrderDetailModule,
		CartModule,
		OverviewModule,
		WebsocketModule,
		TransactionModule,
		WebsocketModule,
		BlogModule,
		ProductReviewModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
