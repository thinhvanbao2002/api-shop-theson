import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from "@nestjs/common";
import { BlogService } from "./blog.service";
import { CreateBlogDto } from "./dto/create-blog.dto";
import { UpdateBlogDto } from "./dto/update-blog.dto";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRoles } from "../user/types/user.type";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("blog")
export class BlogController {
	constructor(private readonly blogService: BlogService) {}

	@Post()
	@Roles(UserRoles.CUSTOMER)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async create(@Body() createBlogDto: CreateBlogDto, @Request() req) {
		return await this.blogService.create(createBlogDto);
	}

	@Get()
	async findAll() {
		return await this.blogService.findAll();
	}

	@Get(":id")
	async findOne(@Param("id") id: string) {
		return await this.blogService.findOne(id);
	}

	@Patch(":id")
	update(@Param("id") id: string, @Body() updateBlogDto: UpdateBlogDto) {
		return this.blogService.update(+id, updateBlogDto);
	}

	@Delete(":id")
	remove(@Param("id") id: string) {
		return this.blogService.remove(+id);
	}
}
