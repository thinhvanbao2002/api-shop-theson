import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
} from "@nestjs/common";
import { WarehouseService } from "./warehouse.service";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";
import { SearchWarehouseDto } from "./dto/search-warehouse.dto";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { GenericController } from "src/common/decorators/controller.decorator";

@GenericController('warehouse')
export class WarehouseController {
    constructor(private readonly warehouseService: WarehouseService) {}

    @Post()
    @ApiOperation({ summary: "Tạo kho hàng mới" })
    create(@Body() createWarehouseDto: CreateWarehouseDto) {
        return this.warehouseService.create(createWarehouseDto);
    }

    @Get()
    @ApiOperation({ summary: "Lấy danh sách kho hàng" })
    findAll(@Query() searchDto: SearchWarehouseDto) {
        return this.warehouseService.findAll(searchDto);
    }

    @Get(":id")
    @ApiOperation({ summary: "Lấy thông tin chi tiết kho hàng" })
    findOne(@Param("id") id: string) {
      console.log('11111111111111111111');
      
        return this.warehouseService.findOne(+id);
    }

    @Patch(":id")
    @ApiOperation({ summary: "Cập nhật thông tin kho hàng" })
    update(
        @Param("id") id: string,
        @Body() updateWarehouseDto: UpdateWarehouseDto,
    ) {
        return this.warehouseService.update(+id, updateWarehouseDto);
    }

    @Delete(":id")
    @ApiOperation({ summary: "Xóa kho hàng" })
    remove(@Param("id") id: string) {
        return this.warehouseService.delete(+id);
    }
} 