import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.entity.ts";

@Entity("permission")
export class Permission {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.permission, {
        nullable: true,
        onDelete: "SET NULL",
    })
    user?: User | null;

    @Column("varchar", { length: 20 })
    slug!: string;

    @Column({ type: "boolean", default: true })
    enabled!: boolean;
}