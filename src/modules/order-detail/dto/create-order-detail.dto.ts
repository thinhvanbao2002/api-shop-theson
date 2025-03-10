import { NumberField, StringField } from "src/common/decorators/field.decorator";

export class CreateOrderDetailDto {
	@NumberField()
	product_id: number;

	@NumberField()
	quantity: number;

	@NumberField()
	total_price: number;

	@StringField()
	size: string;

	@NumberField()
	product_number: string;
}
