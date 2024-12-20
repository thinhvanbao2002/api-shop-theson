import { DateFieldOptional } from "src/common/decorators/field.decorator";
import { PageOptionsDto } from "src/common/dto/page-option.dto";

export class FilterBlogDto extends PageOptionsDto {
	@DateFieldOptional()
	fromDate: string;

	@DateFieldOptional()
	toDate: string;
}
