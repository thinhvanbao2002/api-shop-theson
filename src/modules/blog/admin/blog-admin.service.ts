import { Injectable, NotFoundException } from "@nestjs/common";
import { CreateBlogDto } from "../dto/create-blog.dto";
import { UpdateBlogDto } from "../dto/update-blog.dto";
import { InjectModel } from "@nestjs/sequelize";
import { BlogModel } from "../model/blog.model";
import { FilterBlogDto } from "../dto/filter-blog.dto";
import { WhereOptions } from "sequelize";
import { Op } from "sequelize";
import { PageDto } from "src/common/dto/page.dto";
import { PageMetaDto } from "src/common/dto/page-meta.dto";

@Injectable()
export class BlogAdminService {
	constructor(@InjectModel(BlogModel) private readonly blogRepository: typeof BlogModel) {}
	async create(CreateBlogDto: CreateBlogDto) {
		const blog = await this.blogRepository.create({
			...CreateBlogDto,
		});
		return blog;
	}

	async findAll(dto: FilterBlogDto) {
		const { q, from_date, to_date, status } = dto;
		const whereOptions: WhereOptions = {};

		if (q) whereOptions.title = { [Op.like]: `%${q}%` };

		if (status) whereOptions.status = { [Op.eq]: status };

		const dateConditions = [];

		if (from_date) {
			dateConditions.push({
				[Op.gte]: from_date,
			});
		}
		if (to_date) {
			dateConditions.push({ [Op.lte]: to_date });
		}

		if (dateConditions.length) {
			whereOptions.created_at = { [Op.and]: dateConditions };
		}

		const blogs = await this.blogRepository.findAndCountAll({
			where: whereOptions,
			attributes: ["id", "title", "blog_photo", "status", "created_at", "content"],
			order: [["created_at", "DESC"]],
			limit: dto.take,
			offset: dto.skip,
		});

		return new PageDto(blogs.rows, new PageMetaDto({ itemCount: blogs.count, pageOptionsDto: dto }));
	}

	async findOne(id: string) {
		const blog = await this.blogRepository.findByPk(id);
		return blog;
	}

	async update(id: string, updateBlogDto: UpdateBlogDto) {
		await this.blogRepository.update(
			{ ...updateBlogDto },
			{
				where: { id: { [Op.eq]: id } },
			},
		);
	}

	async remove(id: string) {
		const findBlog = await this.blogRepository.findByPk(id);
		if (!findBlog) {
			throw new NotFoundException("Bài viết không tồn tại");
		}
		await this.blogRepository.destroy({
			where: { id: { [Op.eq]: id } },
		});
	}
}
