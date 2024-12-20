import { Injectable } from "@nestjs/common";
import { CreateBlogDto } from "./dto/create-blog.dto";
import { UpdateBlogDto } from "./dto/update-blog.dto";
import { BlogModel } from "./model/blog.model";
import { InjectModel } from "@nestjs/sequelize";

@Injectable()
export class BlogService {
	constructor(@InjectModel(BlogModel) private readonly blogRepository: typeof BlogModel) {}
	async create(CreateBlogDto: CreateBlogDto) {
		const blog = await this.blogRepository.create({
			...CreateBlogDto,
		});
		return blog;
	}

	async findAll() {
		return `This action returns all blog`;
	}

	async findOne(id: number) {
		return `This action returns a #${id} blog`;
	}

	async update(id: number, updateBlogDto: UpdateBlogDto) {
		return `This action updates a #${id} blog`;
	}

	async remove(id: number) {
		return `This action removes a #${id} blog`;
	}
}
