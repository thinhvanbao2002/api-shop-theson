import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { InjectModel } from "@nestjs/sequelize";
import { ProductModel } from "../model/product.model";
import { ProductPhotoModel } from "src/modules/product-photo/model/product-photo.model";
import { CategoryModel } from "src/modules/category/model/category.model";
import { SearchProductDto } from "../dto/search-product.dto";
import { WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { PageDto } from "src/common/dto/page.dto";
import { PageMetaDto } from "src/common/dto/page-meta.dto";
import { ImportProductDto } from "../dto/import-product.dto";

@Injectable()
export class ProductAdminService {
	constructor(
		@InjectModel(ProductModel) private readonly productRepository: typeof ProductModel,
		@InjectModel(ProductPhotoModel) private productPhotoModel: typeof ProductModel,
		@InjectModel(CategoryModel) private categoryRepository: typeof CategoryModel,
	) {}

	async create(createProductDto: CreateProductDto) {
		const { name, category_id, product_code, price, product_type, quantity, product_photo, description, image } =
			createProductDto;

		const foundCategory = await this.categoryRepository.findOne({
			where: { id: category_id },
		});

		if (!foundCategory) {
			throw new NotFoundException("Không tồn tại danh mục!");
		}

		const product = await this.productRepository.sequelize.transaction(async transaction => {
			const newProduct = await this.productRepository.create(
				{
					product_code,
					name,
					category_id,
					price,
					product_type,
					quantity,
					description,
					image,
				},
				{ transaction },
			);
			if (product_photo && product_photo.length > 0) {
				const payloadProductPhoto = product_photo.map(item => {
					return {
						product_id: newProduct.id,
						url: item.url,
					};
				});

				await this.productPhotoModel.bulkCreate(payloadProductPhoto, { transaction });
			}
			return newProduct;
		});

		return product;
	}

	async findAll(dto: SearchProductDto) {
		const { product_type, q, status, from_date, to_date, brand } = dto;
		const whereOptions: WhereOptions = {};
		const dateConditions = [];

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
		if (dateConditions.length > 0) {
			whereOptions.created_at = { [Op.and]: dateConditions };
		}

		const products = await this.productRepository.findAndCountAll({
			where: whereOptions,
			include: [{ model: CategoryModel }, { model: ProductPhotoModel }],
			order: [["created_at", "DESC"]],
			distinct: true,
			limit: dto.take,
			offset: dto.skip,
		});

		return new PageDto(products.rows, new PageMetaDto({ itemCount: products.count, pageOptionsDto: dto }));
	}

	async findOne(productId: number) {
		const product = await this.productRepository.findOne({
			where: { id: productId },
			include: [{ model: ProductPhotoModel }],
		});

		if (!product) {
			throw new NotFoundException("Không tồn tại sản phẩm!");
		}

		return product;
	}

	async update(productId: number, updateProductDto: UpdateProductDto) {
		const { product_photo } = updateProductDto;
		console.log("🚀 ~ ProductAdminService ~ update ~ product_photo:", product_photo);

		const foundProduct = await this.productRepository.findOne({
			where: { id: productId },
			include: [{ model: ProductPhotoModel }],
		});

		if (!foundProduct) {
			throw new NotFoundException("Không tồn tại sản phẩm!");
		}

		await this.productRepository.sequelize.transaction(async transaction => {
			await this.productRepository.update(
				{
					...updateProductDto,
				},
				{
					where: { id: productId },
					transaction,
				},
			);

			if (product_photo && product_photo.length > 0) {
				const payloadProductPhoto = product_photo.map(item => {
					return {
						url: item.url,
						product_id: productId,
					};
				});

				await this.productPhotoModel.destroy({
					where: { product_id: productId },
					transaction,
				});
				await this.productPhotoModel.bulkCreate(payloadProductPhoto, { transaction });
			}
		});
	}

	async remove(productId: number) {
		const foundProduct = await this.productRepository.findOne({
			where: { id: productId },
			include: [{ model: ProductPhotoModel }],
		});

		if (!foundProduct) {
			throw new NotFoundException("Không tồn tại sản phẩm!");
		}

		await this.productRepository.destroy({ where: { id: productId } });
	}

	async import(productId: number, dto: ImportProductDto) {
		const foundProduct = await this.productRepository.findOne({
			where: { id: productId },
		});

		if (!foundProduct) {
			throw new NotFoundException("Không tồn tại sản phẩm!");
		}

		foundProduct.quantity += dto.quantity;

		foundProduct.save();
	}
}
