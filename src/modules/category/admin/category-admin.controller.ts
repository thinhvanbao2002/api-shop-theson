import { Get, Post, Body, Patch, Param, Delete, Query } from "@nestjs/common";

import { GenericController } from "src/common/decorators/controller.decorator";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { CategoryAdminService } from "./category-admin.service";
import { SearchCategoryDto } from "../dto/search-category.dto";

@GenericController("a/category")
export class CategoryAdminController {
	constructor(private readonly categoryService: CategoryAdminService) {}

	@Get()
	async findAll(@Query() dto: SearchCategoryDto) {
		const categories = await this.categoryService.findAll(dto);
		return categories;
	}

	@Post()
	async create(@Body() createCategoryDto: CreateCategoryDto) {
		return await this.categoryService.create(createCategoryDto);
	}

	@Get(":categoryId")
	findOne(@Param("categoryId") categoryId: number) {
		return this.categoryService.findOne(+categoryId);
	}

	@Patch(":categoryId")
	async update(@Param("categoryId") categoryId: number, @Body() updateCategoryDto: UpdateCategoryDto) {
		return await this.categoryService.update(+categoryId, updateCategoryDto);
	}

	@Delete(":categoryId")
	async remove(@Param("categoryId") categoryId: number) {
		return await this.categoryService.remove(+categoryId);
	}
}
