import { Get, Post, Body, Patch, Param, UseGuards, Request, Query } from "@nestjs/common";
import { OrderService } from "./order.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { GenericController } from "src/common/decorators/controller.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { UserRoles } from "../user/types/user.type";
import { JwtAuthGuard } from "../auth/guards/jwt.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { SearchOrderDto } from "./dto/search-order.dto";
import { CancelOrderDto } from "./dto/cancel-order.dto";

@GenericController("order")
export class OrderController {
	constructor(private readonly orderService: OrderService) {}

	@Post()
	@Roles(UserRoles.CUSTOMER, UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
		return await this.orderService.create(createOrderDto, req);
	}

	@Get()
	@Roles(UserRoles.CUSTOMER, UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async findAll(@Query() dto: SearchOrderDto, @Request() req) {
		const orders = await this.orderService.findAll(dto, req);
		return orders;
	}

	@Get(":id")
	@Roles(UserRoles.CUSTOMER)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async findOne(@Param("id") id: number) {
		return await this.orderService.findOne(+id);
	}

	@Patch("/cancel/:id")
	@Roles(UserRoles.CUSTOMER, UserRoles.ADMIN)
	@UseGuards(JwtAuthGuard, RolesGuard)
	async cancelOrder(@Param("id") id: number, @Body() dto: CancelOrderDto) {
		return this.orderService.cancelOrder(+id, dto);
	}
}
