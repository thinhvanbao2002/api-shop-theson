import { IsArray, IsOptional } from "class-validator";
import { NumberField, StringFieldOptional } from "src/common/decorators/field.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { CreateOrderDetailDto } from "src/modules/order-detail/dto/create-order-detail.dto";

export class CreateOrderDto {
	@StringFieldOptional()
	name?: string;

	@StringFieldOptional()
	phone?: string;

	@StringFieldOptional()
	address?: string;

	@StringFieldOptional()
	note?: string;

	@NumberField()
	total_price: number;

	@StringFieldOptional()
	city: string;

	@StringFieldOptional()
	district: string;

	@StringFieldOptional()
	ward: string;

	@IsArray()
	@ApiProperty()
	@IsOptional()
	items: CreateOrderDetailDto[];
}
