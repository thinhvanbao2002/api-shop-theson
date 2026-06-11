import { StringFieldOptional, NumberFieldOptional } from "src/common/decorators/field.decorator";

export class GetStatisticsDto {
	@StringFieldOptional()
	year?: string;

	@StringFieldOptional()
	month?: string;

	@StringFieldOptional()
	from_date?: string;

	@StringFieldOptional()
	to_date?: string;

	@NumberFieldOptional({ int: true, minimum: 1 })
	limit?: number;
}
