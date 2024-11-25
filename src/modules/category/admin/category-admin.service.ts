import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { CategoryModel } from "../model/category.model";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { UpdateCategoryDto } from "../dto/update-category.dto";
import { SearchCategoryDto } from "../dto/search-category.dto";
import { QueryTypes, WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { PageDto } from "src/common/dto/page.dto";
import { PageMetaDto } from "src/common/dto/page-meta.dto";
import { Sequelize } from "sequelize-typescript";
const modelName = "category";
@Injectable()
export class CategoryAdminService {
	constructor(
		@InjectModel(CategoryModel) private readonly categoryRepository: typeof CategoryModel,
		private readonly sequelize: Sequelize,
	) {}
	async create(createCategoryDto: CreateCategoryDto): Promise<CategoryModel> {
		const { name } = createCategoryDto;

		const [result] = await this.sequelize.query(
			`insert into ${modelName} (name, created_at, updated_at) values (:name, NOW(), NOW())`,
			{
				replacements: { name },
				type: QueryTypes.INSERT,
			},
		);
		return result[0] as CategoryModel;
	}

	async findAll(dto: SearchCategoryDto) {
		const { q, status, from_date, to_date, take, skip } = dto;
		const whereOptions: WhereOptions = {};
		const dateConditions = [];

		if (q) {
			whereOptions.name = { [Op.like]: `%${q}%` };
		}

		if (status) {
			whereOptions.status = { [Op.eq]: status };
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

		const categorys = await this.categoryRepository.findAndCountAll({
			where: whereOptions,
			include: [
				{
					model: CategoryModel,
					as: "children",
				},
			],
			limit: take,
			offset: skip,
		});

		return new PageDto(categorys.rows, new PageMetaDto({ itemCount: categorys.count, pageOptionsDto: dto }));
	}

	async findOne(categoryId: number) {
		const foundCategory = this.sequelize.query(`select * from ${modelName} where id = :id`, {
			replacements: { id: categoryId },
			type: QueryTypes.SELECT,
		});

		if (!foundCategory) {
			throw new NotFoundException("Không tìm thấy danh mục");
		}

		return foundCategory;
	}

	async update(categoryId: number, updateCategoryDto: UpdateCategoryDto): Promise<void> {
		const { name, status } = updateCategoryDto;
		const foundCategory = await this.categoryRepository.findOne({
			where: { id: categoryId },
		});

		if (!foundCategory) {
			throw new NotFoundException("Không tìm thấy danh mục");
		}

		await this.categoryRepository.update(
			{
				name,
				status,
			},
			{
				where: { id: categoryId },
			},
		);
	}

	async remove(categoryId: number): Promise<void> {
		const foundCategory = await this.categoryRepository.findOne({
			where: { id: categoryId },
		});

		if (!foundCategory) {
			throw new NotFoundException("Không tìm thấy danh mục");
		}

		await this.categoryRepository.destroy({
			where: { id: categoryId },
		});
	}
}
