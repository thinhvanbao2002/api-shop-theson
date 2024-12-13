import { NumberFieldOptional, StringFieldOptional } from "src/common/decorators/field.decorator";

export class UpdateCategoryDto {
	@StringFieldOptional()
	name: string;

	@NumberFieldOptional()
	status: number;
}
