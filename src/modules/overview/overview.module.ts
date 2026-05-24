import { Module } from "@nestjs/common";
import { OverviewService } from "./overview.service";
import { OverviewController } from "./overview.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { OrderModel } from "../order/model/order.model";
import { ProductModel } from "../product/model/product.model";
import { CategoryModel } from "../category/model/category.model";
import { UserModel } from "../user/model/user.model";
import { OrderDetailModel } from "../order-detail/model/order-detail.model";
import { ProductReviewModel } from "../product-review/model/product-review.model";

@Module({
	imports: [SequelizeModule.forFeature([OrderModel, ProductModel, CategoryModel, UserModel, OrderDetailModel, ProductReviewModel])],
	controllers: [OverviewController],
	providers: [OverviewService],
})
export class OverviewModule {}

