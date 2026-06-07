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
import { WarehouseModel } from "./warehouse.model";
import { ProductModel } from "src/modules/product/model/product.model";

@Table({
    tableName: "warehouse_product",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
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

    @CreatedAt
    @Column({
        type: DataType.DATE,
        defaultValue: DataType.NOW,
    })
    created_at: Date;

    @UpdatedAt
    @Column({
        type: DataType.DATE,
        defaultValue: DataType.NOW,
    })
    updated_at: Date;

    @DeletedAt
    deleted_at: Date;
} 
