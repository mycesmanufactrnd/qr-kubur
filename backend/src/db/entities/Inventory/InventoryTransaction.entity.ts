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
import { JenazahCase } from "../JenazahCase.entity.js";
import {
  InventoryTransactionSource,
  InventoryTransactionType,
} from "../../enums.js";
import { InventoryItem } from "./InventoryItem.entity.js";
import { InventoryPackage } from "./InventoryPackage.entity.js";

// Immutable audit ledger — rows are never updated or deleted.
@Entity("inventory_transaction")
export class InventoryTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({
    type: "enum",
    enum: InventoryTransactionType,
  })
  transaction_type!: InventoryTransactionType;

  @Index()
  @Column("integer", { nullable: true })
  jenazahCaseId?: number | null;

  @ManyToOne(() => JenazahCase, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "jenazahCaseId" })
  jenazahCase?: JenazahCase | null;

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

  @Column({
    type: "enum",
    enum: InventoryTransactionSource,
    nullable: true,
  })
  source?: InventoryTransactionSource | null;

  @Column("text", { nullable: true })
  notes?: string | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @Column("integer", { nullable: true })
  createdbyId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "createdbyId" })
  createdby?: User | null;
}
