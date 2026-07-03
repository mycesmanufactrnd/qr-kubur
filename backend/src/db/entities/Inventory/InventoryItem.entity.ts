// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
  Index,
} from "typeorm";
import { User } from "../User.entity.js";
import {
  InventoryItemCategory,
  InventoryItemType,
  InventoryItemStatus,
  InventoryUnitType,
} from "../../enums.js";
import { InventoryAsset } from "./InventoryAsset.entity.js";
import { InventoryTransaction } from "./InventoryTransaction.entity.js";
import { PackageItem } from "./PackageItem.entity.js";

@Entity("inventory_item")
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 50, unique: true })
  item_code!: string;

  @Column("varchar", { length: 255 })
  item_name!: string;

  @Index()
  @Column({
    type: "enum",
    enum: InventoryItemCategory,
  })
  category!: InventoryItemCategory;

  @Index()
  @Column({
    type: "enum",
    enum: InventoryItemType,
  })
  item_type!: InventoryItemType;

  @Column({
    type: "enum",
    enum: InventoryUnitType,
  })
  unit_type!: InventoryUnitType;

  @Column("int", { default: 0 })
  current_quantity!: number;

  @Column("int", { default: 0 })
  minimum_stock_level!: number;

  @Column("int", { default: 0 })
  maximum_stock_level!: number;

  @Column("varchar", { length: 255, nullable: true })
  storage_location?: string | null;

  @Index()
  @Column({
    type: "enum",
    enum: InventoryItemStatus,
    default: InventoryItemStatus.AVAILABLE,
  })
  status!: InventoryItemStatus;

  @Column("text", { nullable: true })
  description?: string | null;

  @OneToMany(() => InventoryAsset, (asset) => asset.item)
  assets?: InventoryAsset[];

  @OneToMany(() => InventoryTransaction, (transaction) => transaction.item)
  transactions?: InventoryTransaction[];

  @OneToMany(() => PackageItem, (packageItem) => packageItem.item)
  packageItems?: PackageItem[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @Column("integer", { nullable: true })
  createdbyId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "createdbyId" })
  createdby?: User | null;
}
