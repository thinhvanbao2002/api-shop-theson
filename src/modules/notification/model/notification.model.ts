import {
	BelongsTo,
	Column,
	CreatedAt,
	DataType,
	DeletedAt,
	ForeignKey,
	Model,
	Table,
	UpdatedAt,
} from "sequelize-typescript";
import { UserModel } from "src/modules/user/model/user.model";
import { NotificationType } from "../types/notification.type";

@Table({
	tableName: "notification",
})
export class NotificationModel extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	})
	id: number;

	@Column({
		type: DataType.INTEGER,
	})
	parent_id: number;

	@Column({
		type: DataType.STRING,
	})
	title: string;

	@Column({
		type: DataType.STRING,
	})
	content: string;

	@Column({
		type: DataType.INTEGER,
	})
	@ForeignKey(() => UserModel)
	user_id: number;

	@BelongsTo(() => UserModel)
	user: UserModel;

	@Column({
		type: DataType.ENUM(...Object.values(NotificationType)),
	})
	type: string;

	@Column({
		type: DataType.BOOLEAN,
		defaultValue: true,
	})
	is_read: boolean;

	@Column({
		type: DataType.BOOLEAN,
		defaultValue: true,
	})
	is_created_by_admin: boolean;

	@CreatedAt
	created_at: Date;

	@UpdatedAt
	updated_at: Date;

	@DeletedAt
	deleted_at: Date;
}
