import { Get, Body, Patch, Param, Delete, Query, Post, Put } from "@nestjs/common";
import { GenericController } from "src/common/decorators/controller.decorator";
import { OrderAdminService } from "./order-admin.service";
import { SearchOrderAdminDto } from "../dto/search-order-admin.dto";
import { UpdateOrderDto } from "../dto/update-order.dto";

@GenericController("a/order")
export class OrderAdminController {
	constructor(private readonly orderAdminService: OrderAdminService) {}

	@Get()
	async findAll(@Query() dto: SearchOrderAdminDto) {
		return await this.orderAdminService.findAll(dto);
	}

	@Get(":id")
	async findOne(@Param("id") id: string) {
		return await this.orderAdminService.findOne(+id);
	}

	@Patch(":id")
	async update(@Param("id") id: number, @Body() dto: UpdateOrderDto) {
		return this.orderAdminService.update(+id, dto);
	}

	@Delete(":id")
	async delete(@Param("id") id: number) {
		return this.orderAdminService.delete(+id);
	}

	@Put("/cancel/:id")
	async cancelOrder(@Param("id") id: number) {
		return this.orderAdminService.cancelOrder(id);
	}

	@Post("/trigerWorkFlow/:id")
	async trigerWorkflow(@Param("id") id: number) {
		return this.orderAdminService.trigerWorkFlow(id);
	}

	@Post("/export")
	async export(@Body("id") dto: SearchOrderAdminDto) {
		return this.orderAdminService.exportOrders(dto);
	}
}
