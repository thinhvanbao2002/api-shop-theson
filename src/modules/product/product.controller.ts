import { Get, Param, Delete, Query } from "@nestjs/common";
import { ProductService } from "./product.service";
import { GenericController } from "src/common/decorators/controller.decorator";
import { SearchProductDto } from "./dto/search-product.dto";

@GenericController("product")
export class ProductController {
	constructor(private readonly productService: ProductService) {}
	@Get("best-seller")
	async findBestSeller() {
		return await this.productService.findBestSeller();
	}

	@Get()
	async findAll(@Query() dto: SearchProductDto) {
		return await this.productService.findAll(dto);
	}

	@Get(":id")
	async findOne(@Param("id") id: number) {
		return await this.productService.findOne(+id);
	}

	@Delete(":id")
	remove(@Param("id") id: string) {
		return this.productService.remove(+id);
	}
}
