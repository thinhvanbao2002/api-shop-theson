import {
    Column,
    CreatedAt,
    DataType,
    DeletedAt,
    Model,
    Table,
    HasMany,
    UpdatedAt,
} from "sequelize-typescript";
import { WarehouseProductModel } from "./warehouse-product.model";

@Table({
    tableName: "warehouse",
    timestamps: true,
    paranoid: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    deletedAt: "deleted_at",
})
export class WarehouseModel extends Model {
    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    id: number;

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
    code: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    name: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    address: string;

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

    @HasMany(() => WarehouseProductModel)
    warehouse_products: WarehouseProductModel[];
} 
