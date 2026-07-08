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
  CheckItemCondition,
} from "../../enums.js";
import { InventoryTransaction } from "./InventoryTransaction.entity.js";
import { PackageItem } from "./PackageItem.entity.js";
import { ReusableItemGroup } from "./ReusableItemGroup.entity.js";

@Entity("inventory_item")
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 50, unique: true, nullable: true })
  item_code?: string | null;

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
    nullable: true,
  })
  unit_type?: InventoryUnitType | null;

  @Column("int", { default: 0 })
  current_quantity!: number;

  @Column("int", { default: 0 })
  minimum_level!: number;

  // @Column("int", { nullable: true })
  // maximum_level?: number | null;

  // @Column("decimal", { precision: 10, scale: 2, nullable: true })
  // unit_cost?: number | null;

  @Index()
  @Column({
    type: "enum",
    enum: InventoryItemStatus,
    default: InventoryItemStatus.AVAILABLE,
  })
  status!: InventoryItemStatus;

  @Column("varchar", { length: 255, nullable: true })
  location?: string | null;

  // Reusable items only — physical condition (Good / Damaged).
  @Column({
    type: "enum",
    enum: CheckItemCondition,
    nullable: true,
  })
  condition?: CheckItemCondition | null;

  @Column("text", { nullable: true })
  description?: string | null;

  @Column("integer", { nullable: true })
  groupId?: number | null;

  @ManyToOne(() => ReusableItemGroup, (group) => group.items, { nullable: true, onDelete: "SET NULL", eager: false })
  @JoinColumn({ name: "groupId" })
  group?: ReusableItemGroup | null;

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
