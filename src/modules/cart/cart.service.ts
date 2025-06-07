import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { CreateCartDto } from "./dto/create-cart.dto";
import { UpdateCartDto } from "./dto/update-cart.dto";
import { InjectModel } from "@nestjs/sequelize";
import { CartModel } from "./model/cart.model";
import { ProductModel } from "../product/model/product.model";

@Injectable()
export class CartService {
	constructor(
		@InjectModel(CartModel) private readonly cartRepository: typeof CartModel,
		@InjectModel(ProductModel) private readonly productRepository: typeof ProductModel,
	) {}

	async create(createCartDto: CreateCartDto, req: any) {
		const { product_id, product_number, size } = createCartDto;
		const customerId = req?.user?.id;

		const foundProduct = await this.productRepository.findByPk(product_id);

		if (!foundProduct) {
			throw new NotFoundException("Sản phẩm không tồn tại!");
		}

		const totalPrice = product_number * Number(foundProduct.price);

		// if (foundProduct.quantity <= product_number) {
		// 	throw new BadRequestException("Sản phẩm không đủ!");
		// }

		if (product_number < 1) {
			throw new BadRequestException("Số lượng sản phẩm phải lớn hơn 1!");
		}

		const cart = await this.cartRepository.create({
			size,
			customer_id: customerId,
			product_id: product_id,
			product_number: product_number,
			total_price: totalPrice,
		});

		return cart;
	}

	async findAll(req: any) {
		const customerId = req?.user?.id;

		const carts = await this.cartRepository.findAll({
			where: { customer_id: customerId },
			order: [["created_at", "DESC"]],
			include: [{ model: ProductModel }],
		});

		return carts;
	}

	findOne(id: number) {
		return `This action returns a #${id} cart`;
	}

	async update(id: number, updateCartDto: UpdateCartDto) {
		const { product_number, size } = updateCartDto;

		const foundCart = await this.cartRepository.findOne({
			where: { id: id },
		});

		const foundProduct = await this.productRepository.findOne({
			where: {
				id: foundCart.product_id,
			},
		});

		if (!foundCart) {
			throw new NotFoundException("Sản phẩm trong giỏ hàng không tồn tại!");
		}

		foundCart.product_number = product_number;
		foundCart.size = size;

		// if (foundCart.product_number > foundProduct.quantity) {
		// 	throw new BadRequestException("Số lượng sản phẩm không đủ");
		// }

		await foundCart.save();
	}

	async remove(id: number) {
		const foundCart = await this.cartRepository.findOne({
			where: { id: id },
		});

		if (!foundCart) {
			throw new NotFoundException("Sản phẩm trong giỏ hàng không tồn tại!");
		}

		await this.cartRepository.destroy({
			where: { id: id },
		});
	}
}
