import {
	EnumFieldOptional,
	NumberFieldOptional,
	StringField,
	StringFieldOptional,
} from "src/common/decorators/field.decorator";
import { ProductTypes } from "../types/product.type";
import { ProductStatus } from "../constants/product.constant";
import { IsArray, IsOptional } from "class-validator";
import { CreateProductPhotoDto } from "src/modules/product-photo/dto/create-product-photo.dto";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateProductDto {
	@StringFieldOptional()
	name?: string;

	@NumberFieldOptional()
	category_id?: number;

	@NumberFieldOptional()
	price?: number;

	@EnumFieldOptional(() => ProductTypes)
	product_type?: ProductTypes;

	@EnumFieldOptional(() => ProductStatus)
	status?: ProductStatus;

	@NumberFieldOptional()
	quantity?: number;

	@IsArray()
	@IsOptional()
	@ApiProperty()
	product_photo: CreateProductPhotoDto[];

	@StringFieldOptional({ trim: false })
	description?: string;

	@StringField()
	image: string;
}
