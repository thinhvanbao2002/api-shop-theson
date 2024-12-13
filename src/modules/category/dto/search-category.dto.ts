import { DateFieldOptional, NumberFieldOptional } from "src/common/decorators/field.decorator";
import { PageOptionsDto } from "src/common/dto/page-option.dto";

export class SearchCategoryDto extends PageOptionsDto {
	@NumberFieldOptional()
	status?: number;

	@DateFieldOptional()
	from_date: Date;

	@DateFieldOptional()
	to_date: Date;
}
