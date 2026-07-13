// @ts-nocheck
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Organisation } from "./Organisation.entity.js";
import { User } from "./User.entity.js";
import { ActivityPost } from "./ActivityPosts.entity.js";

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

  @Column("varchar", { length: 255, nullable: true })
  email?: string;

  @Column("varchar", { length: 255, nullable: true })
  url?: string;

  @Column("double precision", { nullable: true })
  latitude?: number;

  @Column("double precision", { nullable: true })
  longitude?: number;

  @ManyToOne(() => Organisation, (organisation) => organisation.mosques, {
    nullable: true,
    onDelete: "SET NULL",
  })
  organisation?: Organisation | null;

  @Column("varchar", { length: 255, nullable: true })
  picname?: string;

  @Column("varchar", { nullable: true })
  picphoneno?: string;

  // ni untuk user tgk je
  @Column("boolean", { default: false })
  canarrangefuneral!: boolean;

  @Column("boolean", { default: false })
  hasdeathcharity!: boolean;

  @OneToMany(() => ActivityPost, (activitypost) => activitypost.mosque)
  activityposts?: ActivityPost[] | [];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @Column("varchar", { length: 255, nullable: true })
  photourl?: string;

  @Column("integer", { nullable: true })
  createdbyId?: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "createdbyId" })
  createdby?: User | null;
}
