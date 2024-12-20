import { StringField } from "src/common/decorators/field.decorator";

export class CreateBlogDto {
	@StringField()
	title: string;

	@StringField()
	blog_photo: string;

	@StringField()
	content: string;
}
