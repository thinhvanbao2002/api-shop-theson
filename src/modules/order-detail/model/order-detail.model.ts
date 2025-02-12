export class OrderDetail {}
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
import { OrderModel } from "src/modules/order/model/order.model";
import { SizeTypes } from "src/modules/order/types/order.type";
import { ProductModel } from "src/modules/product/model/product.model";

@Table({
	tableName: "order_detail",
})
export class OrderDetailModel extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	})
	id: number;

	@Column({
		type: DataType.INTEGER,
	})
	@ForeignKey(() => OrderModel)
	order_id: number;

	@BelongsTo(() => OrderModel)
	order: OrderModel;

	@Column({
		type: DataType.INTEGER,
	})
	@ForeignKey(() => ProductModel)
	product_id: number;

	@BelongsTo(() => ProductModel)
	product: ProductModel;

	@Column({
		type: DataType.INTEGER,
	})
	quantity: number;

	@Column({
		type: DataType.BIGINT,
	})
	price: number;

	@Column({
		type: DataType.INTEGER,
	})
	product_number: number;

	@Column({
		type: DataType.ENUM(...Object.values(SizeTypes)),
	})
	size: SizeTypes;

	@CreatedAt
	created_at: Date;

	@UpdatedAt
	updated_at: Date;

	@DeletedAt
	deleted_at: Date;
}
