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
import { ReusableItemGroup } from "./ReusableItemGroup.entity.js";

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
  package!: any;

  @Index()
  @Column("integer", { nullable: true })
  itemId?: number | null;

  @ManyToOne(() => InventoryItem, (item) => item.packageItems, {
    nullable: true,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "itemId" })
  item?: any;

  // Set instead of itemId for reusable lines picked by group — the
  // fulfilling item is resolved at dispatch time from the group's members.
  @Index()
  @Column("integer", { nullable: true })
  groupId?: number | null;

  @ManyToOne(() => ReusableItemGroup, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "groupId" })
  group?: any;

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
