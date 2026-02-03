import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Organisation } from "./Organisation.entity.ts";

@Entity("mosque")
export class Mosque {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  name!: string;

  @Column("varchar", { length: 255 })
  state!: string;

  @Column("text", { nullable: true })
  address?: string;

  @Column("double precision", { nullable: true })
  latitude?: number;

  @Column("double precision", { nullable: true })
  longitude?: number;

  @ManyToOne(() => Organisation, (organisation) => organisation.mosques, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "organisationid" })
  organisation?: Organisation | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}