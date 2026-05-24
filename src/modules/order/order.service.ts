import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
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
import { WarehouseProductService } from "../warehouse/warehouse-product.service";
import { EmailService } from '../../common/services/email.service';

@Injectable()
export class OrderService {
	constructor(
		@InjectModel(OrderModel) private readonly orderRp: typeof OrderModel,
		@InjectModel(OrderDetailModel) private readonly orderDetailRp: typeof OrderDetailModel,
		@InjectModel(ProductModel) private readonly productRepository: typeof ProductModel,
		@InjectModel(CartModel) private readonly cartRepository: typeof CartModel,
		private readonly warehouseProductService: WarehouseProductService,
		private emailService: EmailService,
	) {}

	async create(createOrderDto: CreateOrderDto, req: any) {
		const { total_price, items, name, phone, address, note, city, district, ward } = createOrderDto;
		const customerId = req?.user?.id;
		const customerEmail = req?.user?.email;

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
					city,
					district,
					ward,
				},
				{ transaction },
			);

			if (items && items.length > 0) {
				const payloadOrderItems = items.map(i => {
					return {
						order_id: order.id,
						product_id: i.product_id,
						quantity: i.product_number,
						price: i.total_price,
						size: i.size,
						product_number: i.product_number,
					};
				});

				if (payloadOrderItems.length > 0) {
					await this.orderDetailRp.bulkCreate(payloadOrderItems, { transaction });

					for (const item of payloadOrderItems) {
						const findProduct = await this.productRepository.findByPk(item.product_id);

						findProduct.quantity -= Number(item.product_number);

						await findProduct.save({ transaction });

						try {
							const deductedWarehouses = await this.warehouseProductService.deductStock(
								item.product_id,
								Number(item.quantity)
							);

							// Lưu log trừ tồn kho (tùy chọn)
							await this.saveStockDeductionLog(order.id, item.product_id, deductedWarehouses);
						} catch (error) {
							// Nếu trừ tồn kho thất bại, transaction sẽ tự rollback
							throw new BadRequestException(error.message);
						}
					}
				}
			}

			// Fetch complete order data with details for email
			const completeOrder = await this.orderRp.findByPk(order.id, {
				include: [
					{
						model: OrderDetailModel,
						include: [
							{
								model: ProductModel,
								attributes: ['name', 'price'],
							},
						],
					},
				],
				transaction,
			});

			// Send confirmation email
			try {
				const emailData = {
					customerName: completeOrder.name,
					orderCode: completeOrder.id,
					createdAt: completeOrder.created_at,
					totalAmount: completeOrder.total_price,
					status: completeOrder.order_status,
					address: completeOrder.address,
					phone: completeOrder.phone,
					orderDetails: completeOrder.order_details,
				  };
				await this.emailService.sendOrderConfirmation(customerEmail, emailData);
			} catch (error) {
				console.error('Failed to send order confirmation email:', error);
				// Don't throw error here to not affect the order creation
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

	// Thêm method để lưu log trừ tồn kho (tùy chọn)
	private async saveStockDeductionLog(order_id: number, product_id: number, deductedWarehouses: any[]) {
		// Implement logic lưu log nếu cần
	}
}
