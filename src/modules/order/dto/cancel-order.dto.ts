import { StringFieldOptional } from "src/common/decorators/field.decorator";

export class CancelOrderDto {
	@StringFieldOptional()
	cancel_reason: number;
}
