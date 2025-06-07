import { Column, DataType, ForeignKey, Model, Table, BelongsTo } from "sequelize-typescript";
import { WarehouseModel } from "./warehouse.model";
import { ProductModel } from "src/modules/product/model/product.model";

@Table({
    tableName: "warehouse_product",
    timestamps: true,
    paranoid: true,
})
export class WarehouseProductModel extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    id: number;

    @ForeignKey(() => WarehouseModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    warehouse_id: number;

    @ForeignKey(() => ProductModel)
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
    })
    product_id: number;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 0,
    })
    quantity: number;

    @BelongsTo(() => WarehouseModel)
    warehouse: WarehouseModel;

    @BelongsTo(() => ProductModel)
    product: ProductModel;

    declare created_at: Date;
    declare updated_at: Date;
    declare deleted_at: Date;
} 