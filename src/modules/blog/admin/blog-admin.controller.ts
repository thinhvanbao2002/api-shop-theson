import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { GenericController } from "src/common/decorators/controller.decorator";
import { CreateBlogDto } from "../dto/create-blog.dto";
import { BlogAdminService } from "./blog-admin.service";
import { UpdateBlogDto } from "../dto/update-blog.dto";
import { FilterBlogDto } from "../dto/filter-blog.dto";

@GenericController("a/blog")
export class BlogAdminController {
	constructor(private readonly blogAdminService: BlogAdminService) {}
	@Post()
	async create(@Body() createBlogDto: CreateBlogDto) {
		return await this.blogAdminService.create(createBlogDto);
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
