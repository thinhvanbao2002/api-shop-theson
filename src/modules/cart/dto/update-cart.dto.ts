import { EnumFieldOptional, NumberFieldOptional } from "src/common/decorators/field.decorator";
import { SizeTypes } from "src/modules/order/types/order.type";

export class UpdateCartDto {
	@NumberFieldOptional()
	product_number: number;

	@EnumFieldOptional(() => SizeTypes)
	size: SizeTypes;

	@NumberFieldOptional()
	total_price: number;
}
