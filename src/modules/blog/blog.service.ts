import { Injectable } from "@nestjs/common";
import { CreateBlogDto } from "./dto/create-blog.dto";
import { UpdateBlogDto } from "./dto/update-blog.dto";
import { BlogModel } from "./model/blog.model";
import { InjectModel } from "@nestjs/sequelize";
import { UserModel } from "../user/model/user.model";

@Injectable()
export class BlogService {
	constructor(@InjectModel(BlogModel) private readonly blogRepository: typeof BlogModel) {}
	async create(CreateBlogDto: CreateBlogDto) {
		console.log("🚀 ~ BlogService ~ create ~ CreateBlogDto:", CreateBlogDto);
		const blog = await this.blogRepository.create({
			...CreateBlogDto,
		});
		return blog;
	}

	async findAll() {
		const blogs = await this.blogRepository.findAll({
			include: [{ model: UserModel }],
		});
		return blogs;
	}

	async findOne(id: string) {
		const blog = await this.blogRepository.findOne({
			where: { id },
			include: [{ model: UserModel }],
		});
		return blog;
	}

	async update(id: number, updateBlogDto: UpdateBlogDto) {
		return `This action updates a #${id} blog`;
	}

	async remove(id: number) {
		return `This action removes a #${id} blog`;
	}
}
