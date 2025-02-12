import { Injectable } from "@nestjs/common";
import { CreateOverviewDto } from "./dto/create-overview.dto";
import { UpdateOverviewDto } from "./dto/update-overview.dto";
import { InjectModel } from "@nestjs/sequelize";
import { OrderModel } from "../order/model/order.model";
import { Sequelize } from "sequelize-typescript";
import { Op } from "sequelize";
import { GetRevenueByMonthDto } from "./dto/get-revenue-by-month.dto";
import { OrderType } from "../order/types/order.type";
import { UserModel } from "../user/model/user.model";
import { ProductModel } from "../product/model/product.model";
import { CategoryModel } from "../category/model/category.model";
import { UserRoles } from "../user/types/user.type";

@Injectable()
export class OverviewService {
	constructor(
		@InjectModel(OrderModel) private readonly orderRepository: typeof OrderModel,
		@InjectModel(UserModel) private readonly userRepository: typeof UserModel,
		@InjectModel(ProductModel) private readonly productRepository: typeof ProductModel,
		@InjectModel(CategoryModel) private readonly categoryRepository: typeof CategoryModel,
	) {}
	create(createOverviewDto: CreateOverviewDto) {
		return "This action adds a new overview";
	}

	async findAll() {
		const countOrders = await this.orderRepository.count();
		const countUsers = await this.userRepository.count({
			where: { role: UserRoles.CUSTOMER },
		});
		const countProducts = await this.productRepository.count();
		const countCategories = await this.categoryRepository.count();

		return {
			countOrders,
			countUsers,
			countProducts,
			countCategories,
		};
	}

	findOne(id: number) {
		return `This action returns a #${id} overview`;
	}

	update(id: number, updateOverviewDto: UpdateOverviewDto) {
		return `This action updates a #${id} overview`;
	}

	remove(id: number) {
		return `This action removes a #${id} overview`;
	}

	async getRevenueByYear(year: string) {
		const revenues = await this.orderRepository.findAll({
			attributes: [
				[Sequelize.fn("MONTH", Sequelize.col("created_at")), "month"],
				[Sequelize.fn("SUM", Sequelize.col("total_price")), "revenue"],
			],
			where: {
				created_at: {
					[Op.between]: [`${year}-01-01`, `${year}-12-31`],
				},
				order_status: OrderType.PAID,
			},
			group: ["month"],
			order: [["month", "ASC"]],
		});

		const monthNames = [
			"Tháng 1",
			"Tháng 2",
			"Tháng 3",
			"Tháng 4",
			"Tháng 5",
			"Tháng 6",
			"Tháng 7",
			"Tháng 8",
			"Tháng 9",
			"Tháng 10",
			"Tháng 11",
			"Tháng 12",
		];

		const monthlyRevenue = monthNames.map((month, index) => ({
			month,
			revenue: 0,
		}));

		revenues.forEach(revenue => {
			const monthIndex = (revenue.get("month") as number) - 1;
			const revenueAmount = parseFloat(revenue.get("revenue") as string);
			monthlyRevenue[monthIndex].revenue = revenueAmount;
		});

		return { monthlyRevenue };
	}

	async getDailyRevenueByMonth(dto: GetRevenueByMonthDto) {
		const { year, month } = dto;

		console.log(year, month);

		const revenues = await this.orderRepository.findAll({
			attributes: [
				[Sequelize.fn("DAY", Sequelize.col("created_at")), "day"],
				[Sequelize.fn("SUM", Sequelize.col("total_price")), "revenue"],
			],
			where: {
				created_at: {
					[Op.between]: [`${year}-${month}-01`, `${year}-${month}-31`],
				},
				order_status: OrderType.PAID,
			},
			group: ["day"],
			order: [["day", "ASC"]],
		});

		const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
		const dailyRevenue = Array(daysInMonth).fill(0);

		revenues.forEach(revenue => {
			const day = revenue.get("day") as number;
			const revenueAmount = revenue.get("revenue") as string;
			dailyRevenue[day - 1] = this.formatPrice(revenueAmount);
		});

		return { year, month, dailyRevenue };
	}

	formatPrice(num: string | any, type?: "VND" | "$") {
		const tmpType = type || "";
		if (num === null || num === undefined || num === "0" || Number.isNaN(parseFloat(num))) return "";
		const result = num.toString().replace(/,/g, "");
		return `${
			result
				.toString()
				.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
				.replace(
					/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|' '|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g,
					"",
				) + tmpType
		}`;
	}
}
