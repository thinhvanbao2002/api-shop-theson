import { Body, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { GenericController } from "src/common/decorators/controller.decorator";
import { CreateBlogDto } from "../dto/create-blog.dto";
import { BlogAdminService } from "./blog-admin.service";
import { UpdateBlogDto } from "../dto/update-blog.dto";
import { FilterBlogDto } from "../dto/filter-blog.dto";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { UserRoles } from "src/modules/user/types/user.type";
import { JwtAuthGuard } from "src/modules/auth/guards/jwt.guard";
import { RolesGuard } from "src/modules/auth/guards/roles.guard";

@GenericController("a/blog")
export class BlogAdminController {
	constructor(private readonly blogAdminService: BlogAdminService) {}
	@Post()
	@Roles(UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async create(@Body() createBlogDto: CreateBlogDto, @Request() req) {
		return await this.blogAdminService.create(createBlogDto, req);
	}

	@Get()
	async findAll(@Query() dto: FilterBlogDto) {
		return await this.blogAdminService.findAll(dto);
	}

	@Get(":id")
	async findOne(@Param("id") id: string) {
		return await this.blogAdminService.findOne(id);
	}

	@Patch(":id")
	async update(@Param("id") id: string, @Body() updateBlogDto: UpdateBlogDto) {
		return await this.blogAdminService.update(id, updateBlogDto);
	}

	@Delete(":id")
	async remove(@Param("id") id: string) {
		return await this.blogAdminService.remove(id);
	}
}
