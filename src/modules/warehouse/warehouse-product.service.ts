import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { WarehouseProductModel } from "./model/warehouse-product.model";
import { CreateWarehouseProductDto } from "./dto/create-warehouse-product.dto";
import { WarehouseModel } from "./model/warehouse.model";
import { ProductModel } from "src/modules/product/model/product.model";
import { Op } from "sequelize";

@Injectable()
export class WarehouseProductService {
    constructor(
        @InjectModel(WarehouseProductModel)
        private readonly warehouseProductRp: typeof WarehouseProductModel,
        @InjectModel(WarehouseModel)
        private readonly warehouseRp: typeof WarehouseModel,
        @InjectModel(ProductModel)
        private readonly productRp: typeof ProductModel,
    ) {}

    async create(dto: CreateWarehouseProductDto) {
        // Kiểm tra kho hàng tồn tại
        const warehouse = await this.warehouseRp.findByPk(dto.warehouse_id);
        if (!warehouse) {
            throw new NotFoundException("Kho hàng không tồn tại!");
        }

        // Kiểm tra sản phẩm tồn tại
        const product = await this.productRp.findByPk(dto.product_id);
        if (!product) {
            throw new NotFoundException("Sản phẩm không tồn tại!");
        }

        // Kiểm tra sản phẩm đã tồn tại trong kho chưa
        const existingProduct = await this.warehouseProductRp.findOne({
            where: {
                warehouse_id: dto.warehouse_id,
                product_id: dto.product_id,
            },
        });

        if (existingProduct) {
            // Cộng dồn số lượng nếu sản phẩm đã tồn tại
            const newQuantity = existingProduct.quantity + dto.quantity;
            await existingProduct.update({ quantity: newQuantity });
            return existingProduct;
        }

        // Tạo mới nếu sản phẩm chưa tồn tại trong kho
        return await this.warehouseProductRp.create({...dto});
    }

    async findAll(warehouse_id: number) {
        return await this.warehouseProductRp.findAll({
            where: { warehouse_id },
            include: [
                {
                    model: ProductModel,
                    attributes: ['id', 'name', 'code', 'price'],
                },
            ],
        });
    }

    async updateQuantity(warehouse_id: number, product_id: number, quantity: number) {
        const warehouseProduct = await this.warehouseProductRp.findOne({
            where: {
                warehouse_id,
                product_id,
            },
        });

        if (!warehouseProduct) {
            throw new NotFoundException("Sản phẩm không tồn tại trong kho!");
        }

        await warehouseProduct.update({ quantity });
        return warehouseProduct;
    }

    async delete(warehouse_id: number, product_id: number) {
        const warehouseProduct = await this.warehouseProductRp.findOne({
            where: {
                warehouse_id,
                product_id,
            },
        });

        if (!warehouseProduct) {
            throw new NotFoundException("Sản phẩm không tồn tại trong kho!");
        }

        await warehouseProduct.destroy();
    }

    async getProductStock(product_id: number) {
        const warehouseProducts = await this.warehouseProductRp.findAll({
            where: { product_id },
            include: [
                {
                    model: WarehouseModel,
                    attributes: ['id', 'name', 'code'],
                },
            ],
        });

        return warehouseProducts;
    }

    async deductStock(product_id: number, quantity: number) {
        // Lấy tất cả kho có sản phẩm này, sắp xếp theo số lượng giảm dần
        const warehouseProducts = await this.warehouseProductRp.findAll({
            where: { 
                product_id,
                quantity: { [Op.gt]: 0 } // Chỉ lấy những kho có số lượng > 0
            },
            order: [['quantity', 'DESC']],
            include: [
                {
                    model: WarehouseModel,
                    attributes: ['id', 'name', 'code'],
                },
            ],
        });

        if (warehouseProducts.length === 0) {
            throw new BadRequestException(`Sản phẩm không còn tồn kho!`);
        }

        let remainingQuantity = quantity;
        const deductedWarehouses = [];

        // Duyệt qua từng kho để trừ số lượng
        for (const wp of warehouseProducts) {
            if (remainingQuantity <= 0) break;

            const deductAmount = Math.min(wp.quantity, remainingQuantity);
            const newQuantity = wp.quantity - deductAmount;
            
            await wp.update({ quantity: newQuantity });
            deductedWarehouses.push({
                warehouse_id: wp.warehouse_id,
                warehouse_name: wp.warehouse.name,
                deducted_quantity: deductAmount,
                remaining_quantity: newQuantity
            });

            remainingQuantity -= deductAmount;
        }

        // Nếu vẫn còn số lượng cần trừ mà không đủ tồn kho
        if (remainingQuantity > 0) {
            throw new BadRequestException(`Không đủ số lượng tồn kho cho sản phẩm!`);
        }

        return deductedWarehouses;
    }
} 