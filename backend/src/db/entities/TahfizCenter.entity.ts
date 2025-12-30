import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { User } from "./User.entity.ts";

@Entity("tahfizcenter")
export class TahfizCenter {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  name!: string;

  @OneToMany(() => User, (user) => user.tahfizcenter)
  user!: User[];

  @CreateDateColumn({ name: "createdat" })
  createdAt!: Date;
}
