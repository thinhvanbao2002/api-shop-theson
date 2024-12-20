import { Column, CreatedAt, DataType, DeletedAt, Model, Table, UpdatedAt } from "sequelize-typescript";
import { CommonStatus } from "src/common/constants";
import { getFullUrl } from "src/common/helpers/ultils";

@Table({
	tableName: "blog",
})
export class BlogModel extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	})
	id: number;

	@Column({
		type: DataType.STRING,
	})
	title: string;

	@Column({
		type: DataType.STRING,
		get(): string {
			return getFullUrl(this.getDataValue("blog_photo"));
		},
	})
	blog_photo: string;

	@Column({
		type: DataType.STRING,
	})
	content: string;

	@Column({
		type: DataType.ENUM(...Object.values(CommonStatus)),
		allowNull: true,
		defaultValue: CommonStatus.ACTIVE,
	})
	status: string;

	@CreatedAt
	created_at: Date;

	@UpdatedAt
	updated_at: Date;

	@DeletedAt
	deleted_at: Date;
}
