import { Module } from "@nestjs/common";
import { ProductService } from "./product.service";
import { ProductController } from "./product.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { ProductModel } from "./model/product.model";
import { ProductPhotoModel } from "../product-photo/model/product-photo.model";
import { ProductAdminController } from "./admin/product-admin.controller";
import { ProductAdminService } from "./admin/product-admin.service";
import { CategoryModel } from "../category/model/category.model";

@Module({
	imports: [SequelizeModule.forFeature([ProductModel, ProductPhotoModel, CategoryModel])],

	controllers: [ProductController, ProductAdminController],
	providers: [ProductService, ProductAdminService],
})
export class ProductModule {}
