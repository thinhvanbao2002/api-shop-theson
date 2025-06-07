import { Column, DataType, Model, Table, HasMany } from "sequelize-typescript";
import { WarehouseProductModel } from "./warehouse-product.model";

@Table({
    tableName: "warehouse",
    timestamps: true,
    paranoid: true,
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

    @Column({
        type: DataType.DATE,
    })
    created_at: Date;

    @Column({
        type: DataType.DATE,
    })
    updated_at: Date;

    @Column({
        type: DataType.DATE,
    })
    deleted_at: Date;

    @HasMany(() => WarehouseProductModel)
    warehouse_products: WarehouseProductModel[];
} 