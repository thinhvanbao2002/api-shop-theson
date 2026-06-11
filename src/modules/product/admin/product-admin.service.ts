import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateProductDto } from "../dto/create-product.dto";
import { UpdateProductDto } from "../dto/update-product.dto";
import { InjectModel } from "@nestjs/sequelize";
import { ProductModel } from "../model/product.model";
import { ProductPhotoModel } from "src/modules/product-photo/model/product-photo.model";
import { WarehouseProductModel } from "src/modules/warehouse/model/warehouse-product.model";
import { CategoryModel } from "src/modules/category/model/category.model";
import { SearchProductDto } from "../dto/search-product.dto";
import { Sequelize, WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { PageDto } from "src/common/dto/page.dto";
import { PageMetaDto } from "src/common/dto/page-meta.dto";
import { ImportProductDto } from "../dto/import-product.dto";
import * as ExcelJS from "exceljs";
import { format } from "date-fns";
import { convertStatus } from "src/common/helpers/ultils";

@Injectable()
export class ProductAdminService {
	constructor(
		@InjectModel(ProductModel) private readonly productRepository: typeof ProductModel,
		@InjectModel(ProductPhotoModel) private productPhotoModel: typeof ProductModel,
		@InjectModel(CategoryModel) private categoryRepository: typeof CategoryModel,
	) {}

	generateProductCode() {
		const now = new Date();
		const datePart = now.toISOString().split("T")[0].replace(/-/g, ""); // Lấy ngày YYYYMMDD
		const recordPart = String(Math.floor(10000 + Math.random() * 90000)); // Sinh số ngẫu nhiên 5 chữ số

		return `SP-${datePart}-${recordPart}`;
	}

	async create(createProductDto: CreateProductDto) {
		const { name, category_id, price, product_type, quantity, product_photo, description, image, introduce } =
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
					product_code: this.generateProductCode(),
					name,
					category_id,
					price,
					product_type,
					quantity,
					description,
					image,
					introduce,
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
		const { product_type, q, status, from_date, to_date, brand, order_price } = dto;
		console.log("🚀 ~ ProductAdminService ~ findAll ~ order_price:", order_price);
		const whereOptions: WhereOptions = {};
		const dateConditions = [];
		let orderConditions: [string, "ASC" | "DESC"][] = [["created_at", "DESC"]];

		if (q) {
			whereOptions.id = {
				[Op.in]: [
					Sequelize.literal(`
          select product.id from product
          where product.name like '%${q}%'
          or product.product_code like '%${q}%'`),
				],
			};
		}

		if (product_type) {
			whereOptions.product_type = { [Op.eq]: product_type };
		}

		if (status !== undefined) {
			whereOptions.status = { [Op.eq]: status };
		}

		if (brand) {
			console.log("🚀 ~ ProductAdminService ~ findAll ~ brand:", brand);
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

		if (order_price === "ASC" || order_price === "DESC") {
			orderConditions = [["price", order_price]];
			console.log("🚀 ~ ProductAdminService ~ findAll ~ orderConditions:", orderConditions);
		}

		const products = await this.productRepository.findAndCountAll({
			where: whereOptions,
			include: [
				{ model: CategoryModel },
				{ model: ProductPhotoModel },
				{ model: WarehouseProductModel, attributes: ["id", "warehouse_id", "product_id", "quantity"] },
			],
			order: orderConditions,
			distinct: true,
			limit: dto.take,
			offset: dto.skip,
		});

		products.rows.forEach(product => {
			const stockQuantity =
				product.warehouse_products?.reduce(
					(total, warehouseProduct) => total + Number(warehouseProduct.quantity || 0),
					0,
				) || 0;

			product.setDataValue("stock_quantity", stockQuantity);
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
		const { product_photo, ...productPayload } = updateProductDto;
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
					...productPayload,
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

	async exportExcelProducts(dto: SearchProductDto) {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet("Báo cáo danh sách sản phẩm");

		worksheet.columns = [
			{ header: "STT", key: "index", width: 10 },
			{ header: "Tên sản phẩm", key: "name", width: 30 },
			{ header: "Giá tiền", key: "price", width: 30 },
			{ header: "Trạng thái", key: "status", width: 30 },
			{ header: "Danh mục", key: "category", width: 30 },
			{ header: "Số lượng còn", key: "quantity", width: 30 },
		];

		worksheet.getRow(1).font = {
			bold: true,
		};

		let hasNextData = true;
		let index = 1;
		do {
			const pagedProducts = await this.findAll(dto);
			pagedProducts.data.forEach(product => {
				const row = {
					index: index++,
					name: product.name,
					price: product.price,
					status: convertStatus(product.status),
					category: product.category.name,
					quantity:
						product.warehouse_products?.reduce(
							(total, warehouseProduct) => total + Number(warehouseProduct.quantity || 0),
							0,
						) || 0,
				};

				worksheet.addRow(row);
			});
			hasNextData = pagedProducts.data?.length > 0;
			dto.page += 1;
		} while (hasNextData);

		const currentDate = format(new Date(), "dd-MM-yyyy_HH-mm-ss");
		const fileName = `DanhSachSanPham_${currentDate}.xlsx`;
		const filePath = `uploads/excels/${fileName}`;
		const fileUrl = `${process.env.API_BASE_URL}/${filePath}`;

		await workbook.xlsx.writeFile(filePath);

		return fileUrl;
	}
}
