// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { InventoryItem } from "./InventoryItem.entity.js";

@Entity("reusable_item_group")
export class ReusableItemGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255, unique: true })
  name!: string;

  @OneToMany(() => InventoryItem, (item) => item.group)
  items?: any[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
