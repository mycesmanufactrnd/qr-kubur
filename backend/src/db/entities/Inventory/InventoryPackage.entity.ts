// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { User } from "../User.entity.js";
import {
  ActiveInactiveStatus,
  InventoryPackageGenderType,
  InventoryPackageAgeGroup,
  InventoryPackageHealthCondition,
  InventoryPackageBodySize,
} from "../../enums.js";
import { PackageItem } from "./PackageItem.entity.js";

@Entity("inventory_package")
export class InventoryPackage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  package_name!: string;

  @Column("text", { nullable: true })
  description?: string | null;

  @Column({
    type: "enum",
    enum: InventoryPackageGenderType,
  })
  gender_type!: InventoryPackageGenderType;

  @Column({
    type: "enum",
    enum: InventoryPackageAgeGroup,
  })
  age_group!: InventoryPackageAgeGroup;

  @Column({
    type: "enum",
    enum: InventoryPackageHealthCondition,
  })
  health_condition!: InventoryPackageHealthCondition;

  @Column({
    type: "enum",
    enum: InventoryPackageBodySize,
    nullable: true,
  })
  body_size?: InventoryPackageBodySize | null;

  @Column({
    type: "enum",
    enum: ActiveInactiveStatus,
    default: ActiveInactiveStatus.ACTIVE,
  })
  status!: ActiveInactiveStatus;

  @Column("varchar", { length: 255, nullable: true })
  location?: string | null;

  @OneToMany(() => PackageItem, (packageItem) => packageItem.package, {
    cascade: ["insert", "update"],
  })
  packageItems?: PackageItem[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @Column("integer", { nullable: true })
  createdbyId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "createdbyId" })
  createdby?: User | null;
}
