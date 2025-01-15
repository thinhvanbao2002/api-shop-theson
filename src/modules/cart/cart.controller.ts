import { Get, Post, Body, Param, Delete, UseGuards, Request, Put } from "@nestjs/common";
import { CartService } from "./cart.service";
import { CreateCartDto } from "./dto/create-cart.dto";
import { UpdateCartDto } from "./dto/update-cart.dto";
import { GenericController } from "src/common/decorators/controller.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UserRoles } from "../user/types/user.type";

@GenericController("cart")
export class CartController {
	constructor(private readonly cartService: CartService) {}

	@Post()
	@Roles(UserRoles.CUSTOMER, UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async create(@Body() createCartDto: CreateCartDto, @Request() req) {
		return await this.cartService.create(createCartDto, req);
	}

	@Get()
	@Roles(UserRoles.CUSTOMER, UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async findAll(@Request() req) {
		return await this.cartService.findAll(req);
	}

	@Get(":id")
	@Roles(UserRoles.CUSTOMER, UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	findOne(@Param("id") id: string) {
		return this.cartService.findOne(+id);
	}

	@Put(":id")
	@Roles(UserRoles.CUSTOMER, UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async update(@Param("id") id: number, @Body() updateCartDto: UpdateCartDto) {
		console.log(updateCartDto);

		return await this.cartService.update(+id, updateCartDto);
	}

	@Delete(":id")
	@Roles(UserRoles.CUSTOMER, UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async remove(@Param("id") id: number) {
		return await this.cartService.remove(+id);
	}
}
