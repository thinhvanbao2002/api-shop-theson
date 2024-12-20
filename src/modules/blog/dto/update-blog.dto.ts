import { StringFieldOptional } from "src/common/decorators/field.decorator";

export class UpdateBlogDto {
	@StringFieldOptional()
	title?: string;

	@StringFieldOptional()
	blog_photo?: string;

	@StringFieldOptional()
	content?: string;
}
