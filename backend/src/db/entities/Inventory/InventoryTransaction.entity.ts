// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { User } from "../User.entity.js";
import { DeadPerson } from "../DeadPerson.entity.js";
import {
  InventoryTransactionSource,
  InventoryTransactionType,
} from "../../enums.js";
import { InventoryItem } from "./InventoryItem.entity.js";
import { InventoryAsset } from "./InventoryAsset.entity.js";
import { InventoryPackage } from "./InventoryPackage.entity.js";

// Immutable audit ledger — rows are never updated or deleted.
@Entity("inventory_transaction")
export class InventoryTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column("timestamptz", { default: () => "NOW()" })
  transaction_date!: Date;

  @Index()
  @Column({
    type: "enum",
    enum: InventoryTransactionType,
  })
  transaction_type!: InventoryTransactionType;

  @Column("varchar", { length: 50, nullable: true })
  reference_type?: string | null;

  // FK to DeadPerson when reference_type = 'JENAZAH_MODULE'.
  // Stored as a plain integer so the ledger row survives if the
  // jenazah record is later deleted (SET NULL via the relation).
  @Index()
  @Column("integer", { nullable: true })
  referenceId?: number | null;

  @ManyToOne(() => DeadPerson, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "referenceId" })
  reference?: DeadPerson | null;

  @Index()
  @Column("integer")
  itemId!: number;

  @ManyToOne(() => InventoryItem, (item) => item.transactions, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "itemId" })
  item!: InventoryItem;

  @Column("integer", { nullable: true })
  packageId?: number | null;

  @ManyToOne(() => InventoryPackage, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "packageId" })
  package?: InventoryPackage | null;

  // Signed quantity: positive = stock in, negative = stock out.
  @Column("int")
  quantity!: number;

  @Column("int")
  before_quantity!: number;

  @Column("int")
  after_quantity!: number;

  @Column("integer", { nullable: true })
  assetId?: number | null;

  @ManyToOne(() => InventoryAsset, (asset) => asset.transactions, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "assetId" })
  asset?: InventoryAsset | null;

  // Snapshot of asset status at transaction time for audit purposes.
  @Column("varchar", { length: 50, nullable: true })
  asset_status?: string | null;

  @Column({
    type: "enum",
    enum: InventoryTransactionSource,
    nullable: true,
  })
  source?: InventoryTransactionSource | null;

  @Column("text", { nullable: true })
  notes?: string | null;

  // Name snapshots so the ledger remains readable if items or packages
  // are renamed after the transaction is recorded.
  @Column("varchar", { length: 255, nullable: true })
  item_name_snapshot?: string | null;

  @Column("varchar", { length: 255, nullable: true })
  package_name_snapshot?: string | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @Column("integer", { nullable: true })
  createdbyId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "createdbyId" })
  createdby?: User | null;
}
