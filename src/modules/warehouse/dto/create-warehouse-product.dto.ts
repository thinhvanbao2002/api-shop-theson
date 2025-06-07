import { IsNotEmpty, IsNumber, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateWarehouseProductDto {
    @ApiProperty({ description: "ID kho hàng" })
    @IsNotEmpty({ message: "ID kho hàng không được để trống" })
    @IsNumber()
    warehouse_id: number;

    @ApiProperty({ description: "ID sản phẩm" })
    @IsNotEmpty({ message: "ID sản phẩm không được để trống" })
    @IsNumber()
    product_id: number;

    @ApiProperty({ description: "Số lượng" })
    @IsNotEmpty({ message: "Số lượng không được để trống" })
    @IsNumber()
    @Min(0, { message: "Số lượng phải lớn hơn hoặc bằng 0" })
    quantity: number;
} 