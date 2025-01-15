import { EnumFieldOptional, NumberField } from "src/common/decorators/field.decorator";
import { SizeTypes } from "src/modules/order/types/order.type";

export class CreateCartDto {
	@NumberField()
	product_id: number;

	@NumberField()
	product_number: number;

	@EnumFieldOptional(() => SizeTypes)
	size: SizeTypes;
}
