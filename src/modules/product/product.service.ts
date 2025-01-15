import { Injectable, NotFoundException } from "@nestjs/common";
import { SearchProductDto } from "./dto/search-product.dto";
import { WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { InjectModel } from "@nestjs/sequelize";
import { ProductModel } from "./model/product.model";
import { ProductPhotoModel } from "../product-photo/model/product-photo.model";
import { CategoryModel } from "../category/model/category.model";
import { PageMetaDto } from "src/common/dto/page-meta.dto";
import { PageDto } from "src/common/dto/page.dto";
import { ProductReviewModel } from "../product-review/model/product-review.model";
import { UserModel } from "../user/model/user.model";

@Injectable()
export class ProductService {
	constructor(
		@InjectModel(ProductModel) private readonly productRepository: typeof ProductModel,
		@InjectModel(ProductPhotoModel) private productPhotoModel: typeof ProductModel,
		@InjectModel(CategoryModel) private categoryRepository: typeof CategoryModel,
	) {}

	async findAll(dto: SearchProductDto) {
		const { product_type, q, status, from_date, to_date, brand, price_range } = dto;
		const whereOptions: WhereOptions = {};
		const dateConditions = [];
		const priceRangeConditions = [];

		if (q) {
			whereOptions.name = { [Op.like]: `%${q}%` };
		}

		if (product_type) {
			whereOptions.product_type = { [Op.eq]: product_type };
		}

		if (status !== undefined) {
			whereOptions.status = { [Op.eq]: status };
		}

		if (brand) {
			whereOptions.category_id = { [Op.eq]: brand };
		}

		if (from_date) {
			dateConditions.push({
				[Op.gte]: from_date,
			});
		}
		if (to_date) {
			dateConditions.push({ [Op.lte]: to_date });
		}

		if (price_range) {
			priceRangeConditions.push({ [Op.gte]: price_range[0] }, { [Op.lte]: price_range[1] });
		}
		if (dateConditions.length > 0) {
			whereOptions.created_at = { [Op.and]: dateConditions };
		}
		if (priceRangeConditions.length) {
			whereOptions.price = { [Op.and]: priceRangeConditions };
		}

		const products = await this.productRepository.findAndCountAll({
			where: whereOptions,
			include: [{ model: CategoryModel }],
			order: [["created_at", "DESC"]],
			limit: dto.take,
			offset: dto.skip,
		});

		return new PageDto(products.rows, new PageMetaDto({ itemCount: products.count, pageOptionsDto: dto }));
	}

	async findOne(id: number) {
		const product = await this.productRepository.findOne({
			where: { id: id },
			include: [
				{ model: ProductPhotoModel },
				{ model: CategoryModel },
				{ model: ProductReviewModel, include: [{ model: UserModel }] },
			],
		});

		if (!product) {
			throw new NotFoundException("Không tồn tại sản phẩm!");
		}

		return product;
	}

	remove(id: number) {
		return `This action removes a #${id} product`;
	}

	async findBestSeller() {
		const products = await this.productRepository.findAll({
			limit: 4,
			offset: 1,
		});

		return products;
	}
}
