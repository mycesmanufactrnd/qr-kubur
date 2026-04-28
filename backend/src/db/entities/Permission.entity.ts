import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.entity.ts";

@Entity("permission")
export class Permission {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User, (user) => user.permissions, {
        nullable: true,
        onDelete: "SET NULL",
    })
    user?: User | null;

    @Column("varchar", { length: 100, nullable: true })
    slug?: string;

    @Column({ type: "boolean", default: true })
    enabled!: boolean;

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}