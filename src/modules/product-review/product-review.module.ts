import { Module } from "@nestjs/common";
import { ProductReviewService } from "./product-review.service";
import { ProductReviewController } from "./product-review.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { ProductReviewModel } from "./model/product-review.model";

@Module({
	imports: [SequelizeModule.forFeature([ProductReviewModel])],
	controllers: [ProductReviewController],
	providers: [ProductReviewService],
})
export class ProductReviewModule {}
