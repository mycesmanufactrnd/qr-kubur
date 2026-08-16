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
import { Grave } from "./Grave.entity.js";
import { GraveSlot } from "./GraveSlot.entity.js";

@Entity("graveblock")
export class GraveBlock {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("integer")
  graveId!: number;

  @ManyToOne(() => Grave, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "graveId" })
  grave!: Grave;

  @Column("varchar", { length: 50 })
  label!: string;

  // Four corner points (top-left, top-right, bottom-right, bottom-left), each
  // {x, y} as a percentage (0-100) of the cemetery photo's width/height, so
  // the block stays correctly positioned regardless of the rendered image size.
  @Column("jsonb")
  corners!: { x: number; y: number }[];

  @Column("int")
  rows!: number;

  @Column("int")
  cols!: number;

  @OneToMany(() => GraveSlot, (slot) => slot.block)
  slots?: GraveSlot[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
