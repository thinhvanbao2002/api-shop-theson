import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { InjectModel } from "@nestjs/sequelize";
import { CategoryModel } from "./model/category.model";
import { CreateChildCategoryDto } from "./dto/create-child-category.dto";
import { SearchCategoryDto } from "./dto/search-category.dto";
import { WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { PageMetaDto } from "src/common/dto/page-meta.dto";
import { PageDto } from "src/common/dto/page.dto";

@Injectable()
export class CategoryService {
	constructor(@InjectModel(CategoryModel) private readonly categoryRepository: typeof CategoryModel) {}
	async create(createCategoryDto: CreateCategoryDto): Promise<CategoryModel> {
		const { name } = createCategoryDto;

		return await this.categoryRepository.create({
			name,
		});
	}

	async createChildCategory(createChildCategory: CreateChildCategoryDto): Promise<CategoryModel> {
		const { parent_id, name } = createChildCategory;

		const foundParentId = await this.categoryRepository.findOne({
			where: { id: parent_id },
		});

		if (!foundParentId) {
			throw new NotFoundException("Không tìm thấy danh mục cha");
		}

		return await this.categoryRepository.create({
			parent_id,
			name,
		});
	}

	async findAll(dto: SearchCategoryDto) {
		const { q, take, skip } = dto;
		console.log("🚀 ~ CategoryService ~ findAll ~ dto:", dto);
		const whereOptions: WhereOptions = {};

		if (q) {
			whereOptions.name = { [Op.like]: `%${q}%` };
		}

		const categories = await this.categoryRepository.findAndCountAll({
			where: whereOptions,
			limit: take,
			offset: skip,
		});

		return new PageDto(categories.rows, new PageMetaDto({ itemCount: categories.count, pageOptionsDto: dto }));
	}

	async findAllChild(dto: SearchCategoryDto) {
		const { q, status, from_date, to_date, take, skip } = dto;
		const whereOptions: WhereOptions = {};
		const dateConditions = [];

		whereOptions.parent_id = { [Op.ne]: null };

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
			limit: 100,
			offset: skip,
		});

		return new PageDto(categorys.rows, new PageMetaDto({ itemCount: categorys.count, pageOptionsDto: dto }));
	}

	async findOne(categoryId: number) {
		const foundCategory = await this.categoryRepository.findOne({
			where: { id: categoryId },
		});

		if (!foundCategory) {
			throw new NotFoundException("Không tìm thấy danh mục");
		}

		return foundCategory;
	}

	update(id: number, updateCategoryDto: UpdateCategoryDto) {
		return `This action updates a #${id} category`;
	}

	remove(id: number) {
		return `This action removes a #${id} category`;
	}
}
