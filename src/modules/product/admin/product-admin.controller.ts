import { Get, Post, Body, Param, Delete, Query, Put, UseGuards } from "@nestjs/common";

import { GenericController } from "src/common/decorators/controller.decorator";
import { ProductAdminService } from "./product-admin.service";
import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { SearchProductDto } from "../dto/search-product.dto";
import { ImportProductDto } from "../dto/import-product.dto";
import { UserRoles } from "src/modules/user/types/user.type";
import { Roles } from "src/modules/auth/decorators/roles.decorator";
import { JwtAuthGuard } from "src/modules/auth/guards/jwt.guard";
import { RolesGuard } from "src/modules/auth/guards/roles.guard";

@GenericController("a/product")
export class ProductAdminController {
	constructor(private readonly productAdminService: ProductAdminService) {}

	@Post()
	@Roles(UserRoles.ADMIN, UserRoles.STAFF)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async create(@Body() createProductDto: CreateProductDto) {
		return await this.productAdminService.create(createProductDto);
	}

	@Get()
	@Roles(UserRoles.ADMIN, UserRoles.STAFF)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async findAll(@Query() dto: SearchProductDto) {
		console.log("🚀 ~ ProductAdminController ~ findAll ~ dto:", dto);
		const products = await this.productAdminService.findAll(dto);
		return products;
	}

	@Get(":productId")
	@Roles(UserRoles.ADMIN, UserRoles.STAFF)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async findOne(@Param("productId") productId: number) {
		return await this.productAdminService.findOne(+productId);
	}

	@Put(":id")
	@Roles(UserRoles.ADMIN, UserRoles.STAFF)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async update(@Param("id") id: string, @Body() updateProductDto: UpdateProductDto) {
		return this.productAdminService.update(+id, updateProductDto);
	}

	@Delete(":productId")
	@Roles(UserRoles.ADMIN, UserRoles.STAFF)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async remove(@Param("productId") productId: number) {
		return await this.productAdminService.remove(+productId);
	}

	@Post("import/:productId")
	@Roles(UserRoles.ADMIN, UserRoles.STAFF)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async importProduct(@Param("productId") productId: number, @Body() dto: ImportProductDto) {
		return await this.productAdminService.import(+productId, dto);
	}

	@Post("export")
	@Roles(UserRoles.ADMIN, UserRoles.STAFF)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async exportProduct(@Body() dto: SearchProductDto) {
		console.log("🚀 ~ ProductAdminController ~ exportProduct ~ dto:", dto);
		return await this.productAdminService.exportExcelProducts(dto);
	}
}
