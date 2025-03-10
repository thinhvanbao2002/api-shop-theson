import { Body, Delete, Get, Param, Patch, Query } from "@nestjs/common";
import { GenericController } from "src/common/decorators/controller.decorator";
import { FilterCustomerDto } from "../dto/filter-customers.dto";
import { CustomerAdminService } from "./customer-admin.service";
import { UpdateCustomerDto } from "../dto/update-customer.dto";

@GenericController("a/customer")
export class CustomerAdminController {
	constructor(private readonly customerAdminService: CustomerAdminService) {}

	@Get()
	async getAllCustomer(@Query() dto: FilterCustomerDto) {
		const customers = await this.customerAdminService.getAllCustomer(dto);
		return customers;
	}

	@Get(":customerId")
	async getSingleCustomer(@Param("customerId") customerId: number) {
		return await this.customerAdminService.getSingleCustomer(+customerId);
	}

	@Patch(":customerId")
	async updateCustomer(@Param("customerId") customerId: number, @Body() dto: UpdateCustomerDto) {
		return await this.customerAdminService.updateCustomer(+customerId, dto);
	}

	@Delete(":customerId")
	async deleteCustomer(@Param("customerId") customerId: number) {
		return await this.customerAdminService.deleteCustomer(+customerId);
	}
}
