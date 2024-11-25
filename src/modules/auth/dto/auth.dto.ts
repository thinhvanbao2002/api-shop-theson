import { EmailFieldOptional, StringFieldOptional } from "src/common/decorators/field.decorator";

export class AuthPayloadDto {
	@StringFieldOptional()
	phone?: string;

	@StringFieldOptional()
	password?: string;
}
