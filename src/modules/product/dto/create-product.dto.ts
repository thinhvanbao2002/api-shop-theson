import {
	EnumField,
	NumberField,
	NumberFieldOptional,
	StringField,
	StringFieldOptional,
} from "src/common/decorators/field.decorator";
import { ProductTypes } from "../types/product.type";
import { IsArray, IsOptional } from "class-validator";
import { CreateProductPhotoDto } from "src/modules/product-photo/dto/create-product-photo.dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateProductDto {
	@StringField()
	name: string;

	@NumberField()
	category_id: number;

	@NumberField()
	price: number;

	@EnumField(() => ProductTypes)
	product_type: ProductTypes;

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

	@StringFieldOptional({ trim: false })
	introduce: string;
}
