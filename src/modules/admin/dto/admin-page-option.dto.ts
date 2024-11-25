import { DateFieldOptional, EnumFieldOptional } from "src/common/decorators/field.decorator";
import { PageOptionsDto } from "src/common/dto/page-option.dto";
import { UserStatus } from "src/modules/user/types/user.type";

export class AdminPageOptionDto extends PageOptionsDto {
	@EnumFieldOptional(() => UserStatus)
	status?: UserStatus;

	@DateFieldOptional()
	from_date?: Date;

	@DateFieldOptional()
	to_date?: Date;
}
