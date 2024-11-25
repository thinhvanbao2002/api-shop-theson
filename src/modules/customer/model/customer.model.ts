import {
	BelongsTo,
	Column,
	CreatedAt,
	DataType,
	DeletedAt,
	ForeignKey,
	HasMany,
	Model,
	Table,
	UpdatedAt,
} from "sequelize-typescript";
import { CustomerInfoModel } from "src/modules/customer-info/model/customer-info.model";
import { UserModel } from "src/modules/user/model/user.model";

@Table({
	tableName: "customer",
})
export class CustomerModel extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
	})
	@ForeignKey(() => UserModel)
	id: string;

	@BelongsTo(() => UserModel)
	user: UserModel;

	@Column({
		type: DataType.INTEGER,
		defaultValue: 0,
	})
	cumulative_score: number;

	@HasMany(() => CustomerInfoModel)
	customer_info: CustomerInfoModel[];

	@CreatedAt
	created_at: Date;

	@UpdatedAt
	updated_at: Date;

	@DeletedAt
	deleted_at: Date;
}
