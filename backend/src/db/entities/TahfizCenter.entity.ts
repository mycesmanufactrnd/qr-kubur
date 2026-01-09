import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { User } from "./User.entity.ts";
import { nullable } from "zod";

@Entity("tahfizcenter")
export class TahfizCenter {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  name!: string;

  @Column("varchar", { length: 255, nullable: true})
  description?: string;

  @Column("text", { array: true, nullable: true })
  serviceoffered?: string[];

  @Column("jsonb", { nullable: true })
  serviceprice?: Record<string, number>;

  @Column("varchar", { length: 255 })
  state!: string;

  @Column("varchar", { length: 255, nullable: true })
  address?: string;
  
  @Column("varchar", { length: 255, nullable: true })
  phone?: string;
  
  @Column("varchar", { length: 255, nullable: true })
  email?: string;
  
  @Column("varchar", { length: 255, nullable: true })
  url?: string;

  @Column("double precision", { nullable: true })
  latitude?: number;

  @Column("double precision", { nullable: true })
  longitude?: number;

  @OneToMany(() => User, (user) => user.tahfizcenter)
  user!: User[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
