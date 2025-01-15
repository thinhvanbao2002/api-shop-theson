import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateOrderDto } from "./dto/create-order.dto";
import { InjectModel } from "@nestjs/sequelize";
import { OrderModel } from "./model/order.model";
import { OrderDetailModel } from "../order-detail/model/order-detail.model";
import { OrderType } from "./types/order.type";
import { SearchOrderDto } from "./dto/search-order.dto";
import { WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { CancelOrderDto } from "./dto/cancel-order.dto";
import { ProductModel } from "../product/model/product.model";
import { CustomerModel } from "../customer/model/customer.model";
import { UserModel } from "../user/model/user.model";
import { CartModel } from "../cart/model/cart.model";

@Injectable()
export class OrderService {
	constructor(
		@InjectModel(OrderModel) private readonly orderRp: typeof OrderModel,
		@InjectModel(OrderDetailModel) private readonly orderDetailRp: typeof OrderDetailModel,
		@InjectModel(ProductModel) private readonly productRepository: typeof ProductModel,
		@InjectModel(CartModel) private readonly cartRepository: typeof CartModel,
	) {}

	async create(createOrderDto: CreateOrderDto, req: any) {
		console.log("🚀 ~ OrderService ~ create ~ createOrderDto:", createOrderDto);
		const { total_price, items, name, phone, address, note, pay_type } = createOrderDto;
		const customerId = req?.user?.id;

		await this.orderRp.sequelize.transaction(async transaction => {
			const order = await this.orderRp.create(
				{
					customer_id: customerId,
					order_status: OrderType.PENDING,
					total_price: total_price,
					name,
					phone,
					address,
					note,
				},
				{ transaction },
			);

			if (items && items.length > 0) {
				const payloadOrderItem = items.map(i => {
					return {
						order_id: order.id,
						product_id: i.product_id,
						quantity: i.quantity,
						price: i.totalPrice,
					};
				});

				if (payloadOrderItem.length > 0) {
					await this.orderDetailRp.bulkCreate(payloadOrderItem, { transaction });
				}
			}
		});
	}

	async findAll(dto: SearchOrderDto, req: any) {
		const { from_date, to_date, type } = dto;
		const customerId = req?.user?.id;
		const dateConditions = [];
		const whereOptions: WhereOptions = {};
		whereOptions.customer_id = { [Op.eq]: customerId };
		if (from_date) {
			dateConditions.push({ [Op.gte]: from_date });
		}
		if (to_date) {
			dateConditions.push({ [Op.lte]: to_date });
		}
		if (dateConditions.length > 0) {
			whereOptions.created_at = { [Op.and]: dateConditions };
		}

		if (type) {
			whereOptions.order_status = { [Op.eq]: type };
		}
		const orders = await this.orderRp.findAll({
			where: whereOptions,
			include: [{ model: OrderDetailModel, include: [{ model: ProductModel }] }],
			order: [["created_at", "DESC"]],
		});

		return orders;
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

	async cancelOrder(id: number, dto: CancelOrderDto) {
		const foundOrder = await this.orderRp.findOne({
			where: { id: id },
		});

		if (!foundOrder) {
			throw new NotFoundException("Đơn hàng không tồn tại!");
		}

		await this.orderRp.update(
			{
				order_status: OrderType.CANCELED,
				cancel_reason: dto.cancel_reason,
			},
			{ where: { id: id } },
		);
	}
}
