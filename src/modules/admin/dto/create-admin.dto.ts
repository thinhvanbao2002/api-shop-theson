import {
	DateFieldOptional,
	EmailFieldOptional,
	EnumField,
	EnumFieldOptional,
	StringField,
	StringFieldOptional,
} from "src/common/decorators/field.decorator";
import { UserRoles, UserStatus } from "src/modules/user/types/user.type";

export class CreateAdminDto {
	@StringField()
	name?: string;

	@StringFieldOptional()
	phone?: string;

	@EmailFieldOptional()
	email?: string;

	@StringFieldOptional()
	password?: string;

	@StringFieldOptional()
	avatar?: string;

	@DateFieldOptional()
	birth_day?: Date;

	@EnumFieldOptional(() => UserStatus)
	status: UserStatus;

	@DateFieldOptional()
	last_login: Date;

	@EnumField(() => UserRoles)
	role: UserRoles;
}
