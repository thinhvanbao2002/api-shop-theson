import { InjectModel } from "@nestjs/sequelize";

import { WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { PageDto } from "src/common/dto/page.dto";
import { PageMetaDto } from "src/common/dto/page-meta.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { UserModel } from "src/modules/user/model/user.model";
import { CustomerModel } from "../model/customer.model";
import { CustomerInfoModel } from "src/modules/customer-info/model/customer-info.model";
import { FilterCustomerDto } from "../dto/filter-customers.dto";
import { UserRoles } from "src/modules/user/types/user.type";
import { UpdateCustomerDto } from "../dto/update-customer.dto";
import { CUSTOMER_ERR } from "../constants/customer.constant";

@Injectable()
export class CustomerAdminService {
	constructor(
		@InjectModel(UserModel) private readonly userRepository: typeof UserModel,
		@InjectModel(CustomerModel) private readonly customerRepository: typeof CustomerModel,
		@InjectModel(CustomerInfoModel) private readonly customerInfoRepository: typeof CustomerInfoModel,
	) {}

	async getAllCustomer(dto: FilterCustomerDto) {
		const { q, status, from_date, to_date } = dto;

		const whereOptions: WhereOptions = {};
		const dateConditions = [];

		whereOptions.role = { [Op.eq]: UserRoles.CUSTOMER };
		if (q) {
			const searchKeyword = `%${q}%`;
			Object.assign(whereOptions, {
				[Op.or]: [
					{ phone: { [Op.like]: searchKeyword } },
					{ name: { [Op.like]: searchKeyword } },
					{ email: { [Op.like]: searchKeyword } },
				],
			});
		}
		if (status) {
			whereOptions.status = { [Op.eq]: status };
		}
		if (from_date) {
			dateConditions.push({
				[Op.gte]: from_date,
			});
		}
		if (to_date) {
			dateConditions.push({ [Op.lte]: to_date });
		}
		if (dateConditions.length > 0) {
			whereOptions.created_at = { [Op.and]: dateConditions };
		}

		const customers = await this.userRepository.findAndCountAll({
			where: whereOptions,
			include: [{ model: CustomerModel }],
			order: [["created_at", "DESC"]],
			limit: dto.take,
			offset: dto.skip,
		});
		return new PageDto(customers.rows, new PageMetaDto({ itemCount: customers.count, pageOptionsDto: dto }));
	}

	async getSingleCustomer(customerId: number): Promise<UserModel> {
		const foundCustomer = await this.userRepository.findOne({
			where: { id: customerId },
			include: [{ model: CustomerModel }],
		});
		if (!foundCustomer) {
			throw new NotFoundException(CUSTOMER_ERR.CUSTOMER_NOT_FOUND);
		}
		return foundCustomer;
	}

	async updateCustomer(customerId: number, updateCustomerDto: UpdateCustomerDto) {
		const foundCustomer = await this.userRepository.findOne({
			where: { id: customerId },
		});
		if (!foundCustomer) {
			throw new NotFoundException(CUSTOMER_ERR.CUSTOMER_NOT_FOUND);
		}
		await this.userRepository.update(
			{
				...updateCustomerDto,
			},
			{
				where: { id: customerId },
			},
		);
	}

	async deleteCustomer(customerId: number) {
		const foundCustomer = await this.userRepository.findOne({
			where: { id: customerId },
		});
		if (!foundCustomer) {
			throw new NotFoundException(CUSTOMER_ERR.CUSTOMER_NOT_FOUND);
		}

		await this.userRepository.sequelize.transaction(async transaction => {
			await this.customerRepository.destroy({
				where: { id: customerId },
				transaction,
			});

			await this.userRepository.destroy({
				where: { id: customerId },
				transaction,
			});
		});
	}
}
