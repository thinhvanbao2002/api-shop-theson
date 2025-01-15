import { NumberField, StringField } from "src/common/decorators/field.decorator";

export class CreateProductReviewDto {
	@NumberField()
	product_id: number;

	@StringField()
	comment: string;
}
