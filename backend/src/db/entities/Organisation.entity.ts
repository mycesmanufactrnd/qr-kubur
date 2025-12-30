import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from "typeorm";
import { User } from "./User.entity.ts";

@Entity("organisation")
export class Organisation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  name!: string;

  @OneToMany(() => User, (user) => user.organisation)
  user!: User[];

  @CreateDateColumn({ name: "createdat" })
  createdAt!: Date;
}
