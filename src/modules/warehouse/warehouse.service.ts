import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { WarehouseModel } from "./model/warehouse.model";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";
import { SearchWarehouseDto } from "./dto/search-warehouse.dto";
import { PageDto } from "src/common/dto/page.dto";
import { PageMetaDto } from "src/common/dto/page-meta.dto";
import { WhereOptions, Op } from "sequelize";
import * as moment from "moment";
import { WarehouseProductModel } from "./model/warehouse-product.model";
import { ProductModel } from "../product/model/product.model";
import { CategoryModel } from "../category/model/category.model";

@Injectable()
export class WarehouseService {
    constructor(
        @InjectModel(WarehouseModel)
        private readonly warehouseRp: typeof WarehouseModel,
    ) {}

  async create(dto: CreateWarehouseDto): Promise<WarehouseModel> {
        console.log("🚀 ~ WarehouseService ~ create ~ dto:", dto)
      
    return await this.warehouseRp.create({
      code: dto.code,
      name: dto.name,
      address: dto.address
        });
    }

    async findAll(dto: SearchWarehouseDto) {
        const { q, code, name, from_date, to_date } = dto;
        const whereOptions: WhereOptions = {};
        const dateConditions = [];

      if (q) {
			whereOptions.name = { [Op.like]: `%${q}%` };
		  }

        if (code) {
            whereOptions.code = { [Op.like]: `%${code}%` };
        }

        if (name) {
            whereOptions.name = { [Op.like]: `%${name}%` };
        }

        if (from_date) {
            dateConditions.push({
                [Op.gte]: moment(from_date).startOf("date").toDate(),
            });
        }

        if (to_date) {
            dateConditions.push({
                [Op.lte]: moment(to_date).endOf("date").toDate(),
            });
        }

        if (dateConditions.length > 0) {
            whereOptions.created_at = { [Op.and]: dateConditions };
        }

        const warehouses = await this.warehouseRp.findAndCountAll({
            where: whereOptions,
            order: [["created_at", "DESC"]],
            limit: dto.take,
            offset: dto.skip,
        });

        return new PageDto(
            warehouses.rows,
            new PageMetaDto({
                itemCount: warehouses.count,
                pageOptionsDto: dto,
            }),
        );
    }

    async findOne(id: number) {
        const warehouse = await this.warehouseRp.findOne({
            where: { id },
            include: [
                {
                    model: WarehouseProductModel,
                    include: [
                        {
                            model: ProductModel,
                            attributes: [
                                'id', 
                                'name', 
                                'price',
                                'description',
                                'image',
                                'category_id'
                            ],
                            include: [
                                {
                                    model: CategoryModel,
                                    attributes: ['id', 'name']
                                }
                            ]
                        }
                    ],
                    attributes: [
                        'id',
                        'product_id',
                        'quantity',
                        'created_at',
                        'updated_at'
                    ]
                }
            ]
        });

        if (!warehouse) {
            throw new NotFoundException("Kho hàng không tồn tại!");
        }

        return warehouse;
    }

    async update(id: number, dto: UpdateWarehouseDto) {
        const warehouse = await this.findOne(id);
        await warehouse.update(dto);
        return warehouse;
    }

    async delete(id: number) {
        const warehouse = await this.findOne(id);
        await warehouse.destroy();
    }
} 
