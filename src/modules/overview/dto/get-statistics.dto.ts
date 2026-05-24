import { StringFieldOptional, NumberFieldOptional } from "src/common/decorators/field.decorator";

export class GetStatisticsDto {
	@StringFieldOptional()
	year?: string;

	@NumberFieldOptional({ int: true, minimum: 1 })
	limit?: number;
}
