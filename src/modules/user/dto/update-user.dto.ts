import { StringFieldOptional } from "src/common/decorators/field.decorator";

export class UpdateUserDto {
	@StringFieldOptional()
	name: string;

	@StringFieldOptional()
	password: string;

	@StringFieldOptional()
	newPassword: string;

	@StringFieldOptional()
	avatar: string;
}
