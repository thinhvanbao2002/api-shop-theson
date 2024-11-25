import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateOrderDetailDto } from "src/modules/order-detail/dto/create-order-detail.dto";
import { UpdateOrderDetailDto } from "src/modules/order-detail/dto/update-order-detail.dto";
import { SearchOrderAdminDto } from "../dto/search-order-admin.dto";
import { where, WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { InjectModel } from "@nestjs/sequelize";
import { OrderModel } from "../model/order.model";
import { OrderDetailModel } from "src/modules/order-detail/model/order-detail.model";
import { PageDto } from "src/common/dto/page.dto";
import { PageMetaDto } from "src/common/dto/page-meta.dto";
import { CustomerModel } from "src/modules/customer/model/customer.model";
import { UserModel } from "src/modules/user/model/user.model";
import { ProductModel } from "src/modules/product/model/product.model";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { OrderType, PayTypes } from "../types/order.type";

@Injectable()
export class OrderAdminService {
	constructor(
		@InjectModel(OrderModel) private readonly orderRp: typeof OrderModel,
		@InjectModel(OrderDetailModel) private readonly orderDetailRp: typeof OrderDetailModel,
	) {}

	async findAll(dto: SearchOrderAdminDto) {
		const { order_status, from_date, to_date } = dto;

		const dateConditions = [];
		const whereOptions: WhereOptions = {};

		if (order_status) {
			whereOptions.order_status = { [Op.eq]: order_status };
		}

		if (from_date) {
			dateConditions.push({ [Op.gte]: from_date });
		}

		if (to_date) {
			dateConditions.push({ [Op.lte]: to_date });
		}

		if (dateConditions.length > 0) {
			whereOptions.created_at = { [Op.and]: dateConditions };
		}

		const orders = await this.orderRp.findAndCountAll({
			where: whereOptions,
			include: [
				{ model: OrderDetailModel, include: [{ model: ProductModel }] },
				{ model: CustomerModel, include: [{ model: UserModel }] },
			],
			order: [["created_at", "DESC"]],
			limit: dto.take,
			offset: dto.skip,
		});

		return new PageDto(orders.rows, new PageMetaDto({ itemCount: orders.count, pageOptionsDto: dto }));
	}

	async findOne(id: number) {
		const foundOrder = await this.orderRp.findOne({
			where: { id: id },
			include: [
				{ model: OrderDetailModel, include: [{ model: ProductModel }] },
				{ model: CustomerModel, include: [{ model: UserModel }] },
			],
		});

		if (!foundOrder) {
			throw new NotFoundException("Đơn hàng không tồn tại!");
		}

		return foundOrder;
	}

	async update(id: number, dto: UpdateOrderDto) {
		let { order_status, pay_type } = dto;

		const foundOrder = await this.orderRp.findOne({
			where: { id: id },
		});

		if (order_status === OrderType.COMPLETED) {
			pay_type = PayTypes.PAID;
		}

		if (!foundOrder) {
			throw new NotFoundException("Đơn hàng không tồn tại!");
		}

		await this.orderRp.update(
			{
				order_status: order_status,
				pay_type: pay_type,
			},
			{
				where: { id: id },
			},
		);
	}

	async delete(id: number) {
		const foundOrder = await this.orderRp.findOne({
			where: { id: id },
		});

		if (!foundOrder) {
			throw new NotFoundException("Không tồn tại đơn hàng!");
		}

		await this.orderRp.destroy({
			where: { id },
		});
	}

	async cancelOrder(id: number) {
		const foundOrder = await this.orderRp.findByPk(id);

		if (!foundOrder) {
			throw new NotFoundException("Không tồn tại đơn hàng!");
		}

		await this.orderRp.update(
			{
				order_status: OrderType.CANCELLED,
			},
			{
				where: { id },
			},
		);
	}

	async trigerWorkFlow(id: number) {
		const foundOrder = await this.orderRp.findByPk(id);
		const maxStep = Number(OrderType.COMPLETED);

		if (!foundOrder) {
			throw new NotFoundException("Không tồn tại đơn hàng!");
		}

		const newStatus = Number(foundOrder.order_status) + 1;

		if (newStatus > maxStep) {
			throw new BadRequestException("Đơn hàng đã hoàn thành!");
		}

		await this.orderRp.update(
			{
				order_status: newStatus,
			},
			{
				where: { id },
			},
		);

		return newStatus;
	}
}
