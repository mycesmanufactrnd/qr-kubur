// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { InventoryItemType } from "../../enums.js";
import { InventoryPackage } from "./InventoryPackage.entity.js";
import { InventoryItem } from "./InventoryItem.entity.js";

@Entity("package_item")
export class PackageItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column("integer")
  packageId!: number;

  @ManyToOne(() => InventoryPackage, (pkg) => pkg.packageItems, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "packageId" })
  package!: InventoryPackage;

  @Index()
  @Column("integer")
  itemId!: number;

  @ManyToOne(() => InventoryItem, (item) => item.packageItems, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "itemId" })
  item!: InventoryItem;

  @Column("int", { default: 1 })
  quantity_required!: number;

  // Snapshot of item_type at package creation time. Intentional
  // denormalisation: drives consumable vs asset dispatch logic in
  // processPackage without an extra join per line item.
  @Column({
    type: "enum",
    enum: InventoryItemType,
  })
  item_type!: InventoryItemType;
}
