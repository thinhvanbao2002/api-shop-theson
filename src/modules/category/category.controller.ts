import { Get, Body, Patch, Param, Delete, Query } from "@nestjs/common";
import { CategoryService } from "./category.service";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { GenericController } from "src/common/decorators/controller.decorator";
import { SearchCategoryDto } from "./dto/search-category.dto";

@GenericController("category")
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Get("child")
	async findAllChild(@Query() dto: SearchCategoryDto) {
		const categorys = this.categoryService.findAllChild(dto);
		return categorys;
	}

	@Get()
	async findAll(@Query() dto: SearchCategoryDto) {
		const categorys = this.categoryService.findAll(dto);
		return categorys;
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
