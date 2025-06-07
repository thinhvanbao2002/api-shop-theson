import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { WarehouseService } from "./warehouse.service";
import { WarehouseController } from "./warehouse.controller";
import { WarehouseModel } from "./model/warehouse.model";
import { WarehouseProductModel } from "./model/warehouse-product.model";
import { WarehouseProductService } from "./warehouse-product.service";
import { WarehouseProductController } from "./warehouse-product.controller";
import { ProductModel } from "src/modules/product/model/product.model";
import { CategoryModel } from "src/modules/category/model/category.model";

@Module({
    imports: [
        SequelizeModule.forFeature([
            WarehouseModel,
            WarehouseProductModel,
            ProductModel,
            CategoryModel
        ]),
    ],
    controllers: [WarehouseController, WarehouseProductController],
    providers: [WarehouseService, WarehouseProductService],
    exports: [WarehouseService, WarehouseProductService],
})
export class WarehouseModule {} 