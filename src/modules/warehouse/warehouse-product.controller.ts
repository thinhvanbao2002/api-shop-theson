import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Patch,
} from "@nestjs/common";
import { WarehouseProductService } from "./warehouse-product.service";
import { CreateWarehouseProductDto } from "./dto/create-warehouse-product.dto";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { GenericController } from "src/common/decorators/controller.decorator";
import { WarehouseProductModel } from "./model/warehouse-product.model";

@GenericController("warehouse-product")
export class WarehouseProductController {
    constructor(private readonly warehouseProductService: WarehouseProductService) {}

    @Post()
    @ApiOperation({ summary: "Thêm sản phẩm vào kho" })
    create(@Body() createDto: CreateWarehouseProductDto):Promise<WarehouseProductModel> {
        return this.warehouseProductService.create(createDto);
    }

    @Get("warehouse/:warehouse_id")
    @ApiOperation({ summary: "Lấy danh sách sản phẩm trong kho" })
    findAll(@Param("warehouse_id") warehouse_id: string) {
        return this.warehouseProductService.findAll(+warehouse_id);
    }

    @Patch(":warehouse_id/:product_id")
    @ApiOperation({ summary: "Cập nhật số lượng sản phẩm trong kho" })
    updateQuantity(
        @Param("warehouse_id") warehouse_id: string,
        @Param("product_id") product_id: string,
        @Body("quantity") quantity: number,
    ) {
        return this.warehouseProductService.updateQuantity(
            +warehouse_id,
            +product_id,
            quantity,
        );
    }

    @Delete(":warehouse_id/:product_id")
    @ApiOperation({ summary: "Xóa sản phẩm khỏi kho" })
    remove(
        @Param("warehouse_id") warehouse_id: string,
        @Param("product_id") product_id: string,
    ) {
        return this.warehouseProductService.delete(+warehouse_id, +product_id);
    }

    @Get("product/:product_id")
    @ApiOperation({ summary: "Lấy thông tin tồn kho của sản phẩm" })
    getProductStock(@Param("product_id") product_id: string) {
        return this.warehouseProductService.getProductStock(+product_id);
    }
} 