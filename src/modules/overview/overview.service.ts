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
import { OrderDetailModel } from "../order-detail/model/order-detail.model";
import { ProductReviewModel } from "../product-review/model/product-review.model";
import { GetStatisticsDto } from "./dto/get-statistics.dto";

@Injectable()
export class OverviewService {
	constructor(
		@InjectModel(OrderModel) private readonly orderRepository: typeof OrderModel,
		@InjectModel(UserModel) private readonly userRepository: typeof UserModel,
		@InjectModel(ProductModel) private readonly productRepository: typeof ProductModel,
		@InjectModel(CategoryModel) private readonly categoryRepository: typeof CategoryModel,
		@InjectModel(OrderDetailModel) private readonly orderDetailRepository: typeof OrderDetailModel,
		@InjectModel(ProductReviewModel) private readonly productReviewRepository: typeof ProductReviewModel,
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

	async getStatistics(dto: GetStatisticsDto) {
		const year = dto.year || new Date().getFullYear().toString();
		const limit = dto.limit || 5;

		// 1. Top best-selling products (top sản phẩm bán chạy nhất)
		const topSellingProducts = await this.orderDetailRepository.findAll({
			attributes: [
				"product_id",
				[Sequelize.fn("SUM", Sequelize.col("OrderDetailModel.quantity")), "total_sold"],
			],
			include: [
				{
					model: OrderModel,
					where: { order_status: OrderType.PAID },
					attributes: [],
				},
				{
					model: ProductModel,
					attributes: ["name", "price", "image"],
				},
			],
			group: ["product_id", "product.id"],
			order: [[Sequelize.literal("total_sold"), "DESC"]],
			limit: limit,
		});

		// 2. Top customers (khách hàng mua hàng nhiều nhất)
		const topCustomers = await this.orderRepository.findAll({
			attributes: [
				"customer_id",
				[Sequelize.fn("SUM", Sequelize.col("total_price")), "total_spent"],
				[Sequelize.fn("COUNT", Sequelize.col("OrderModel.id")), "total_orders"],
			],
			where: { order_status: OrderType.PAID },
			include: [
				{
					model: UserModel,
					attributes: ["name", "email", "phone", "avatar"],
				},
			],
			group: ["customer_id", "customer.id"],
			order: [[Sequelize.literal("total_spent"), "DESC"]],
			limit: limit,
		});

		// 3. Products with the most reviews (sản phẩm có nhiều đánh giá bình luận nhất)
		const topReviewedProducts = await this.productReviewRepository.findAll({
			attributes: [
				"product_id",
				[Sequelize.fn("COUNT", Sequelize.col("ProductReviewModel.id")), "total_reviews"],
			],
			include: [
				{
					model: ProductModel,
					attributes: ["name", "price", "image"],
				},
			],
			group: ["product_id", "product.id"],
			order: [[Sequelize.literal("total_reviews"), "DESC"]],
			limit: limit,
		});

		// 4. Revenue of month, year, quarter
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

		const monthlyRevenue = Array(12).fill(0).map((_, i) => ({
			month: `Tháng ${i + 1}`,
			revenue: 0,
		}));

		let currentYearRevenue = 0;
		revenues.forEach(revenue => {
			const monthVal = revenue.get("month") as number;
			const monthIndex = monthVal - 1;
			const revenueAmount = parseFloat(revenue.get("revenue") as string || "0");
			monthlyRevenue[monthIndex].revenue = revenueAmount;
			currentYearRevenue += revenueAmount;
		});

		const quarterlyRevenue = [
			{ quarter: "Quý 1", revenue: monthlyRevenue[0].revenue + monthlyRevenue[1].revenue + monthlyRevenue[2].revenue },
			{ quarter: "Quý 2", revenue: monthlyRevenue[3].revenue + monthlyRevenue[4].revenue + monthlyRevenue[5].revenue },
			{ quarter: "Quý 3", revenue: monthlyRevenue[6].revenue + monthlyRevenue[7].revenue + monthlyRevenue[8].revenue },
			{ quarter: "Quý 4", revenue: monthlyRevenue[9].revenue + monthlyRevenue[10].revenue + monthlyRevenue[11].revenue },
		];

		const now = new Date();
		const currentMonthIndex = now.getMonth(); // 0-11
		const currentQuarterIndex = Math.floor(currentMonthIndex / 3); // 0-3

		const currentMonthRevenue = monthlyRevenue[currentMonthIndex]?.revenue || 0;
		const currentQuarterRevenue = quarterlyRevenue[currentQuarterIndex]?.revenue || 0;

		return {
			topSellingProducts,
			topCustomers,
			topReviewedProducts,
			revenue: {
				year,
				byMonth: monthlyRevenue,
				byQuarter: quarterlyRevenue,
				currentMonth: currentMonthRevenue,
				currentQuarter: currentQuarterRevenue,
				currentYear: currentYearRevenue,
			}
		};
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
