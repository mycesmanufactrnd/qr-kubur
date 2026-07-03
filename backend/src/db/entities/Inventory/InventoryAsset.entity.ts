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
import { DeadPerson } from "../DeadPerson.entity.js";
import { InventoryAssetCondition, InventoryAssetStatus } from "../../enums.js";
import { InventoryItem } from "./InventoryItem.entity.js";
import { InventoryTransaction } from "./InventoryTransaction.entity.js";

@Entity("inventory_asset")
export class InventoryAsset {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 100, unique: true, nullable: true })
  asset_number?: string | null;

  @Index()
  @Column("integer")
  itemId!: number;

  @ManyToOne(() => InventoryItem, (item) => item.assets, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "itemId" })
  item!: InventoryItem;

  @Index()
  @Column({
    type: "enum",
    enum: InventoryAssetStatus,
    default: InventoryAssetStatus.AVAILABLE,
  })
  current_status!: InventoryAssetStatus;

  // Null when not in use. SET NULL on DeadPerson delete so the asset
  // record survives even if the jenazah record is cleaned up later.
  @Column("integer", { nullable: true })
  assignedJenazahId?: number | null;

  @ManyToOne(() => DeadPerson, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "assignedJenazahId" })
  assignedJenazah?: DeadPerson | null;

  @Column("timestamptz", { nullable: true })
  last_used_date?: Date | null;

  @Column({
    type: "enum",
    enum: InventoryAssetCondition,
    default: InventoryAssetCondition.GOOD,
  })
  condition!: InventoryAssetCondition;

  @Column("varchar", { length: 255, nullable: true })
  assigned_to?: string | null;

  @Column("text", { nullable: true })
  notes?: string | null;

  @OneToMany(() => InventoryTransaction, (transaction) => transaction.asset)
  transactions?: InventoryTransaction[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @Column("integer", { nullable: true })
  createdbyId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "createdbyId" })
  createdby?: User | null;
}
