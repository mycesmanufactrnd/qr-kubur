import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Grave } from "../Grave.entity.ts";
import { Mosque } from "../Mosque.entity.ts";
import { TahfizCenter } from "../TahfizCenter.entity.ts";
import { Organisation } from "../Organisation.entity.ts";
import { CollectionTree } from "./CollectionTree.entity.ts";

@Entity("collectiontreeitem")
export class CollectionTreeItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("integer", { nullable: true })
  collectionTreeId?: number | null;

  @ManyToOne(() => CollectionTree, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "collectionTreeId" })
  collectionTree?: CollectionTree | null;

  @Column("integer", { nullable: true })
  graveId?: number | null;

  @ManyToOne(() => Grave, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "graveId" })
  grave?: Grave | null;

  @Column("integer", { nullable: true })
  mosqueId?: number | null;

  @ManyToOne(() => Mosque, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "mosqueId" })
  mosque?: Mosque | null;

  @Column("integer", { nullable: true })
  tahfizId?: number | null;

  @ManyToOne(() => TahfizCenter, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "tahfizId" })
  tahfiz?: TahfizCenter | null;

  @Column("integer", { nullable: true })
  organisationId?: number | null;

  @ManyToOne(() => Organisation, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "organisationId" })
  organisation?: Organisation | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
