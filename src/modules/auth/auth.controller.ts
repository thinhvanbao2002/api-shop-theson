import { Post, Body, Request, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthPayloadDto } from "./dto/auth.dto";
import { GenericController } from "src/common/decorators/controller.decorator";
import { ChangePassworDto } from "./dto/change-password.dto";
import { UserRoles } from "../user/types/user.type";
import { Roles } from "./decorators/roles.decorator";
import { JwtAuthGuard } from "./guards/jwt.guard";
import { RolesGuard } from "./guards/roles.guard";

@GenericController("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("login")
	async create(@Body() authPayload: AuthPayloadDto) {
		const { phone, password } = authPayload;
		return await this.authService.validateAdmin(phone, password);
	}

	@Post("change-password")
	@Roles(UserRoles.CUSTOMER, UserRoles.STAFF, UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async changePassword(@Body() dto: ChangePassworDto, @Request() req) {
		return await this.authService.changePassword(dto, req);
	}
}
