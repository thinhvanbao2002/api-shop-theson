import { Column, CreatedAt, DataType, DeletedAt, Model, Table, UpdatedAt } from "sequelize-typescript";
import { CategoryStatus } from "../constants/category.contant";

@Table({
	tableName: "category",
})
export class CategoryModel extends Model {
	@Column({
		autoIncrement: true,
		type: DataType.INTEGER,
		primaryKey: true,
	})
	id: number;

	@Column({ type: DataType.STRING, allowNull: true })
	name: number;

	@Column({ type: DataType.INTEGER, defaultValue: CategoryStatus.ACTIVE })
	status: CategoryStatus;

	@CreatedAt
	created_at: Date;

	@UpdatedAt
	updated_at: Date;

	@DeletedAt
	deleted_at: Date;
}
