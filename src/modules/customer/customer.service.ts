import { BadRequestException, Injectable } from "@nestjs/common";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { InjectModel } from "@nestjs/sequelize";
import { UserModel } from "../user/model/user.model";
import { CustomerModel } from "./model/customer.model";
import { CustomerInfoModel } from "../customer-info/model/customer-info.model";
import { ERR_USER } from "../user/constants/user.constant";
import * as bcrypt from "bcrypt";
import { UserRoles } from "../user/types/user.type";
import { FilterCustomerDto } from "./dto/filter-customers.dto";
import { WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { PageDto } from "src/common/dto/page.dto";
import { PageMetaDto } from "src/common/dto/page-meta.dto";

@Injectable()
export class CustomerService {
	constructor(
		@InjectModel(UserModel) private readonly userRepository: typeof UserModel,
		@InjectModel(CustomerModel) private readonly customerRepository: typeof CustomerModel,
		@InjectModel(CustomerInfoModel) private readonly customerInfoRepository: typeof CustomerInfoModel,
	) {}
	async registerCustomer(createCustomerDto: CreateCustomerDto) {
		const { name, phone, password, avatar, email, birth_day, address } = createCustomerDto;

		const foundPhone = await this.userRepository.findOne({
			where: { phone: phone },
		});
		const foundEmail = await this.userRepository.findOne({
			where: { email: email },
		});

		if (foundPhone) {
			throw new BadRequestException(ERR_USER.PHONE_EXITS);
		}
		if (foundEmail) {
			throw new BadRequestException(ERR_USER.EMAIL_EXITS);
		}
		await this.userRepository.sequelize.transaction(async transaction => {
			const SALT = bcrypt.genSaltSync();

			const passwordHash = await bcrypt.hash(password, SALT);

			const user = await this.userRepository.create(
				{
					name,
					phone,
					password: passwordHash,
					avatar,
					email,
					birth_day,
					role: UserRoles.CUSTOMER,
				},
				{ transaction },
			);
			await this.customerRepository.create(
				{
					id: user.id,
				},
				{ transaction },
			);

			await this.customerInfoRepository.create(
				{
					customer_name: name,
					customer_id: user.id,
					customer_phone: phone,
					customer_address: address,
				},
				{ transaction },
			);
		});
	}

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

	getSingleCustomer(id: number) {
		return `This action returns a #${id} customer`;
	}

	async update(updateCustomerDto: UpdateCustomerDto, req: any) {
		const { name, avatar } = updateCustomerDto;
		const customerId = req?.user?.id;

		console.log("Customer Id: ", customerId);
		console.log("Name", name);
		console.log("Avatar", avatar);

		await this.userRepository.update(
			{
				name,
				avatar,
			},
			{
				where: { id: customerId },
			},
		);
	}

	remove(id: number) {
		return `This action removes a #${id} customer`;
	}
}
