import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from "@nestjs/common";
import { ProductReviewService } from "./product-review.service";
import { CreateProductReviewDto } from "./dto/create-product-review.dto";
import { UpdateProductReviewDto } from "./dto/update-product-review.dto";
import { UserRoles } from "../user/types/user.type";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";

@Controller("product-review")
export class ProductReviewController {
	constructor(private readonly productReviewService: ProductReviewService) {}

	@Post()
	@Roles(UserRoles.CUSTOMER, UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async create(@Body() createProductReviewDto: CreateProductReviewDto, @Request() req) {
		return await this.productReviewService.create(createProductReviewDto, req);
	}

	@Get()
	async findAll(@Param("id") id: string) {
		return await this.productReviewService.findAll(id);
	}

	@Get(":id")
	findOne(@Param("id") id: string) {
		return this.productReviewService.findOne(+id);
	}

	@Patch(":id")
	update(@Param("id") id: string, @Body() updateProductReviewDto: UpdateProductReviewDto) {
		return this.productReviewService.update(+id, updateProductReviewDto);
	}

	@Delete(":id")
	remove(@Param("id") id: string) {
		return this.productReviewService.remove(+id);
	}
}
