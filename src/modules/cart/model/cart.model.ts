import {
	BeforeSave,
	BeforeUpdate,
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
import { CustomerModel } from "src/modules/customer/model/customer.model";
import { ProductModel } from "src/modules/product/model/product.model";

@Table({
	tableName: "cart",
})
export class CartModel extends Model {
	@Column({
		type: DataType.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	})
	id: number;

	@Column({
		type: DataType.INTEGER,
	})
	@ForeignKey(() => CustomerModel)
	customer_id: number;

	@BelongsTo(() => CustomerModel)
	customer: CustomerModel;

	@Column({
		type: DataType.INTEGER,
	})
	@ForeignKey(() => ProductModel)
	product_id: number;

	@BelongsTo(() => ProductModel)
	product: ProductModel;

	@Column({
		type: DataType.INTEGER,
		defaultValue: 1,
	})
	product_number: number;

	@Column({
		type: DataType.BIGINT,
	})
	total_price: number;

	@CreatedAt
	created_at: Date;

	@UpdatedAt
	updated_at: Date;

	@DeletedAt
	deleted_at: Date;

	@BeforeSave
	@BeforeUpdate
	static async calculateTotalPrice(instance: CartModel) {
		if (instance.product_id && instance.product_number) {
			const product = await ProductModel.findByPk(instance.product_id);
			if (product) {
				instance.total_price = instance.product_number * product.price; // Assuming 'price' is the column in ProductModel
			}
		}
	}
}
