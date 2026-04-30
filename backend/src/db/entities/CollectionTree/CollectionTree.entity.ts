import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Organisation } from "../Organisation.entity.ts";

@Entity("collectiontree")
export class CollectionTree {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("integer", { nullable: true })
  organisationId?: number | null;

  @ManyToOne(() => Organisation, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "organisationId" })
  organisation?: Organisation | null;

  @Column("varchar", { length: 255 })
  name!: string;

  @Column("varchar", { length: 255, nullable: true })
  description?: string | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
