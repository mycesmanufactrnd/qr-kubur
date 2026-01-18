import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { User } from "./User.entity.ts";
import { Suggestion } from "./Suggestion.entity.ts";
import { Donation } from "./Donation.entity.ts";
import { TahlilRequest } from "./TahlilRequest.entity.js";
import { TahfizPaymentConfig } from "./TahfizPaymentConfig.entity.ts";

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

  @Column({ type: "boolean", default: false })
  canbedonated!: boolean;

  @OneToMany(() => User, (users) => users.tahfizcenter)
  users!: User[];

  @OneToMany(() => Donation, (donations) => donations.tahfizcenter)
  donations!: Donation[];

  @OneToMany(() => TahlilRequest, (tahlilrequests) => tahlilrequests.tahfizcenter)
  tahlilrequests!: TahlilRequest[];

  @OneToMany(() => TahfizPaymentConfig, (tahfizpaymentconfigs) => tahfizpaymentconfigs.tahfizcenter)
  tahfizpaymentconfigs!: TahfizPaymentConfig[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;
}
