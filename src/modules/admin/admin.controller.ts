import { Body, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { GenericController } from "src/common/decorators/controller.decorator";
import { AdminPageOptionDto } from "./dto/admin-page-option.dto";
import { UpdateAdminDto } from "./dto/update-admin.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRoles } from "../user/types/user.type";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CreateAdminDto } from "./dto/create-admin.dto";

@GenericController("admin")
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Post()
	@Roles(UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async createManager(@Body() dto: CreateAdminDto) {
		return this.adminService.createAdmin(dto);
	}

	@Get()
	@Roles(UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async findAll(@Query() dto: AdminPageOptionDto) {
		return this.adminService.findAll(dto);
	}

	@Get(":adminId")
	async getSingleAdmin(@Param("adminId") adminId: number) {
		const admin = await this.adminService.getSingleAdmin(+adminId);
		return admin;
	}

	@Put(":adminId")
	async updateAdmin(@Param("adminId") adminId: number, @Body() dto: UpdateAdminDto) {
		await this.adminService.updateAdmin(+adminId, dto);
	}

	@Delete(":adminId")
	async deleteAdmin(@Param("adminId") adminId: number) {
		await this.adminService.deleteAdmin(+adminId);
	}
}
