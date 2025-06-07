import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { SearchOrderAdminDto } from "../dto/search-order-admin.dto";
import { Sequelize, WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { InjectModel } from "@nestjs/sequelize";
import { OrderModel } from "../model/order.model";
import { OrderDetailModel } from "src/modules/order-detail/model/order-detail.model";
import { PageDto } from "src/common/dto/page.dto";
import { PageMetaDto } from "src/common/dto/page-meta.dto";
import { UserModel } from "src/modules/user/model/user.model";
import { ProductModel } from "src/modules/product/model/product.model";
import { UpdateOrderDto } from "../dto/update-order.dto";
import { OrderType, PayTypes } from "../types/order.type";
import * as ExcelJS from "exceljs";
import { vldOrderStatus } from "src/common/helpers/ultils";
import { format } from "date-fns";
import * as moment from "moment";

@Injectable()
export class OrderAdminService {
	constructor(
		@InjectModel(OrderModel) private readonly orderRp: typeof OrderModel,
		@InjectModel(OrderDetailModel) private readonly orderDetailRp: typeof OrderDetailModel,
	) {}

	async findAll(dto: SearchOrderAdminDto) {
		const { q, order_status, from_date, to_date } = dto;
		const dateConditions = [];
		const whereOptions: WhereOptions = {};

		if (q) {
			whereOptions.id = {
				[Op.in]: [
					Sequelize.literal(
						`select o.id from \`order\` as o
            join user on o.customer_id = user.id
            where user.name like '%${q}%'`,
					),
				],
			};
		}

		if (order_status) {
			whereOptions.order_status = { [Op.eq]: order_status };
		}

		if (from_date) {
			dateConditions.push({ [Op.gte]: moment(from_date).startOf("date").toDate() });
		}
		if (to_date) {
			dateConditions.push({ [Op.lte]: moment(to_date).endOf("date").toDate() });
		}

		if (dateConditions.length > 0) {
			console.log("🚀 ~ OrderAdminService ~ findAll ~ dateConditions:", dateConditions);
			whereOptions.created_at = { [Op.and]: dateConditions };
		}

		const orders = await this.orderRp.findAndCountAll({
			where: whereOptions,
			include: [
				{ model: OrderDetailModel, include: [{ model: ProductModel }] },
				{ model: UserModel, attributes: ["name", "phone", "email", "role"] },
			],
			distinct: true,
			order: [["created_at", "DESC"]],
			limit: dto.take,
			offset: dto.skip,
		});

		return new PageDto(orders.rows, new PageMetaDto({ itemCount: orders.count, pageOptionsDto: dto }));
	}

	async findOne(id: number) {
		const foundOrder = await this.orderRp.findOne({
			where: { id: id },
			include: [{ model: OrderDetailModel, include: [{ model: ProductModel }] }],
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

		if (order_status === OrderType.PAID) {
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
				order_status: OrderType.CANCELED,
			},
			{
				where: { id },
			},
		);
	}

	async trigerWorkFlow(id: number) {
		const foundOrder = await this.orderRp.findByPk(id);
		const maxStep = Number(OrderType.PAID);

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

	async exportOrders(dto: SearchOrderAdminDto) {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Báo cáo danh sách đơn hàng");

		worksheet.columns = [
			{ header: "STT", key: "index", width: 10 },
			{ header: "Tên khách hàng", key: "name", width: 30 },
			{ header: "Số điện thoại", key: "phone", width: 30 },
			{ header: "Số lượng sản phẩm", key: "number", width: 30 },
			{ header: "Ngày đặt hàng", key: "created", width: 30 },
			{ header: "Trạng thái", key: "status", width: 30 },
			{ header: "Địa chỉ", key: "address", width: 30 },
		];

		worksheet.getRow(1).font = {
			bold: true,
		};

		let hasNextData = true;
		let index = 1;

		do {
			const pagedOrders = await this.findAll(dto);
			pagedOrders.data.forEach(order => {
				const row = {
					index: index++,
					name: order?.customer?.name || '',
					phone: order?.customer?.phone || '',
					number: order?.order_details?.length || 0,
					created: order?.created_at ? format(new Date(order.created_at), 'dd/MM/yyyy HH:mm') : '',
					status: order?.order_status ? vldOrderStatus(Number(order.order_status)) : 'Không xác định',
					address: order?.address || '',
				};
				worksheet.addRow(row);
			});

			hasNextData = pagedOrders.data.length > 0;
			dto.page++;
		} while (hasNextData);

		const currentDate = format(new Date(), "dd-MM-yyyy_HH-mm-ss");
		const fileName = `DanhSachDonHang_${currentDate}.xlsx`;
		const filePath = `uploads/excels/${fileName}`;
		const fileUrl = `${process.env.API_BASE_URL}/${filePath}`;

		await workbook.xlsx.writeFile(filePath);
		return fileUrl;
	}
}
