import { Column, DataType, Table, Model, CreatedAt, UpdatedAt, DeletedAt, HasOne } from "sequelize-typescript";
import { UserRoles, UserStatus } from "../types/user.type";
import { AdminModel } from "src/modules/admin/model/admin.model";
import { getFullUrl } from "src/common/helpers/ultils";
import { CustomerModel } from "src/modules/customer/model/customer.model";
import { ProductReviewModel } from "src/modules/product-review/model/product-review.model";
import { BlogModel } from "src/modules/blog/model/blog.model";

@Table({
	tableName: "user",
})
export class UserModel extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	})
	id: string;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	name: string;

	@Column({
		type: DataType.STRING(10),
		allowNull: false,
	})
	phone: string;

	@Column({
		type: DataType.STRING(),
		allowNull: false,
	})
	email: string;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	password: string;

	@Column({
		type: DataType.STRING,
		allowNull: true,
		get(): string {
			return getFullUrl(this.getDataValue("avatar"));
		},
	})
	avatar: string;

	@Column({
		type: DataType.DATE,
		allowNull: true,
	})
	last_login: Date;

	@Column({
		type: DataType.DATE,
		allowNull: true,
	})
	birth_day: Date;

	@Column({
		type: DataType.ENUM(...Object.values(UserStatus)),
		allowNull: false,
		defaultValue: UserStatus.ACTIVE,
	})
	status: string;

	@Column({
		type: DataType.ENUM(...Object.values(UserRoles)),
		allowNull: false,
	})
	role: string;

	@Column({
		type: DataType.STRING(1000),
		allowNull: true,
	})
	token: string;

	@Column({
		type: DataType.STRING(1000),
		allowNull: true,
	})
	verify_token: string;

	@Column({
		type: DataType.STRING(1000),
		allowNull: true,
	})
	device_token: string;

	@CreatedAt
	created_at: Date;

	@UpdatedAt
	updated_at: Date;

	@DeletedAt
	deleted_at: Date;

	@HasOne(() => AdminModel)
	admin: AdminModel;

	@HasOne(() => CustomerModel)
	customer: CustomerModel;

	@HasOne(() => ProductReviewModel)
	product_reviews: ProductReviewModel[];

	@HasOne(() => BlogModel)
	blogs: BlogModel;
}
