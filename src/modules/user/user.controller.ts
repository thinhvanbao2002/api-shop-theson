import { Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from "@nestjs/common";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { GenericController } from "src/common/decorators/controller.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRoles } from "./types/user.type";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@GenericController("user")
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Post("/register")
	async createUser(@Body() createUserDto: CreateUserDto) {
		console.log("🚀 ~ UserController ~ createUser ~ createUserDto:", createUserDto);
		const admin = await this.userService.createUser(createUserDto);
		return admin;
	}

	@Get()
	@Roles(UserRoles.CUSTOMER, UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async getUserInfo(@Request() req) {
		return await this.userService.getUserInfo(req);
	}

	@Get(":id")
	findOne(@Param("id") id: string) {
		return this.userService.findOne(+id);
	}

	@Patch(":id")
	async update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
		return await this.userService.update(+id, updateUserDto);
	}

	@Delete(":id")
	remove(@Param("id") id: string) {
		return this.userService.remove(+id);
	}
}
