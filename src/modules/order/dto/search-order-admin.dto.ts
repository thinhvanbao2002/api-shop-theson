import { DateFieldOptional, EnumFieldOptional } from "src/common/decorators/field.decorator";
import { PageOptionsDto } from "src/common/dto/page-option.dto";
import { OrderType } from "../types/order.type";

export class SearchOrderAdminDto extends PageOptionsDto {
	@EnumFieldOptional(() => OrderType)
	order_status: OrderType;

	@DateFieldOptional()
	from_date?: Date;

	@DateFieldOptional()
	to_date?: Date;
}
