import { DateFieldOptional, StringFieldOptional } from "src/common/decorators/field.decorator";
import { PageOptionsDto } from "src/common/dto/page-option.dto";

export class FilterBlogDto extends PageOptionsDto {
	@DateFieldOptional()
	from_date?: string;

	@DateFieldOptional()
	to_date?: string;

	@StringFieldOptional()
	status?: string;
}
