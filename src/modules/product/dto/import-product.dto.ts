import { NumberField, StringFieldOptional } from "src/common/decorators/field.decorator";
export class ImportProductDto {
	@NumberField()
	quantity: number;

	@StringFieldOptional()
	note?: string;
}
