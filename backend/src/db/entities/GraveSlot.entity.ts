// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
} from "typeorm";
import { GraveBlock } from "./GraveBlock.entity.js";
import { DeadPerson } from "./DeadPerson.entity.js";

@Entity("graveslot")
export class GraveSlot {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("integer")
  blockId!: number;

  @ManyToOne(() => GraveBlock, (block) => block.slots, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "blockId" })
  block!: GraveBlock;

  @Column("int")
  rowIndex!: number;

  @Column("int")
  colIndex!: number;

  @Column("varchar", { length: 100 })
  label!: string;

  @OneToOne(() => DeadPerson, (deadperson) => deadperson.graveslot)
  deadperson?: DeadPerson | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
