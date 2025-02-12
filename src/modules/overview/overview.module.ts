import { Module } from "@nestjs/common";
import { OverviewService } from "./overview.service";
import { OverviewController } from "./overview.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { OrderModel } from "../order/model/order.model";
import { ProductModel } from "../product/model/product.model";
import { CategoryModel } from "../category/model/category.model";
import { UserModel } from "../user/model/user.model";

@Module({
	imports: [SequelizeModule.forFeature([OrderModel, ProductModel, CategoryModel, UserModel])],
	controllers: [OverviewController],
	providers: [OverviewService],
})
export class OverviewModule {}
