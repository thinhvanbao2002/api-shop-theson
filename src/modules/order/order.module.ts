import { Module } from "@nestjs/common";
import { OrderService } from "./order.service";
import { OrderController } from "./order.controller";
import { SequelizeModule } from "@nestjs/sequelize";
import { OrderModel } from "./model/order.model";
import { OrderDetailModel } from "../order-detail/model/order-detail.model";
import { OrderAdminController } from "./admin/order-admin.controller";
import { OrderAdminService } from "./admin/order-admin.service";
import { ProductModel } from "../product/model/product.model";
import { CartModel } from "../cart/model/cart.model";
import { WarehouseProductService } from "../warehouse/warehouse-product.service";
import { WarehouseModel } from "../warehouse/model/warehouse.model";
import { WarehouseProductModel } from "../warehouse/model/warehouse-product.model";
import { EmailModule } from "src/common/services/email.module";

@Module({
	imports: [
		SequelizeModule.forFeature([OrderModel, OrderDetailModel, ProductModel, CartModel, WarehouseModel, WarehouseProductModel]),
		EmailModule,
	],
	controllers: [OrderController, OrderAdminController],
	providers: [OrderService, OrderAdminService, WarehouseProductService],
	exports: [OrderService],
})
export class OrderModule {}
