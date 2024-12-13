import { Get, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { GenericController } from "src/common/decorators/controller.decorator";
import { SearchCategoryDto } from "./dto/search-category.dto";

@GenericController("category")
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Get()
	async findAll(@Query() dto: SearchCategoryDto) {
		const categories = this.categoryService.findAll(dto);
		return categories;
	}

	@Get(":id")
	findOne(@Param("id") id: string) {
		return this.categoryService.findOne(+id);
	}

	@Patch(":id")
	update(@Param("id") id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
		return this.categoryService.update(+id, updateCategoryDto);
	}

	@Delete(":id")
	remove(@Param("id") id: string) {
		return this.categoryService.remove(+id);
	}
}
