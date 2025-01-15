import {
	DateFieldOptional,
	EnumFieldOptional,
	NumberFieldOptional,
	StringFieldOptional,
} from "src/common/decorators/field.decorator";
import { ProductTypes } from "../types/product.type";
import { PageOptionsDto } from "src/common/dto/page-option.dto";
import { IsArray, IsOptional } from "class-validator";

export class SearchProductDto extends PageOptionsDto {
	@EnumFieldOptional(() => ProductTypes)
	product_type?: ProductTypes;

	@NumberFieldOptional()
	status?: number;

	@DateFieldOptional()
	from_date?: Date;

	@DateFieldOptional()
	to_date?: Date;

	@NumberFieldOptional()
	brand?: number;

	@StringFieldOptional()
	order_price?: string;

	@IsArray()
	@IsOptional()
	price_range?: [number, number];
}
