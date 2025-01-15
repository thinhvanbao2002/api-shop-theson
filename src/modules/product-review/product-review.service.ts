import { Injectable } from "@nestjs/common";
import { CreateProductReviewDto } from "./dto/create-product-review.dto";
import { UpdateProductReviewDto } from "./dto/update-product-review.dto";
import { ProductReviewModel } from "./model/product-review.model";
import { InjectModel } from "@nestjs/sequelize";

@Injectable()
export class ProductReviewService {
	constructor(@InjectModel(ProductReviewModel) private readonly productReviewRepository: typeof ProductReviewModel) {}

	async create(createProductReviewDto: CreateProductReviewDto, req: any) {
		const userId = req?.user?.id;
		const productReview = await this.productReviewRepository.create({ user_id: userId, ...createProductReviewDto });
		return productReview;
	}

	async findAll(id: string) {
		return `This action returns all productReview`;
	}

	findOne(id: number) {
		return `This action returns a #${id} productReview`;
	}

	update(id: number, updateProductReviewDto: UpdateProductReviewDto) {
		return `This action updates a #${id} productReview`;
	}

	remove(id: number) {
		return `This action removes a #${id} productReview`;
	}
}
