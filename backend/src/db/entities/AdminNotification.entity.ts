import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { NotificationType } from "../enums.ts";

@Entity("adminnotification")
export class AdminNotification {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255, nullable: true })
    receiveremail?: string;

    @Column({
        type: "enum",
        enum: NotificationType,
        nullable: true,
    })
    type?: NotificationType;
    
    @Column("varchar", { length: 255 })
    title!: string;
    
    @Column("text")
    message!: string;

    @Column("integer", { nullable: true })
    entityid?: number;

    @Column("varchar", { length: 255, nullable: true })
    statusentity?: string;
    
    @Column({ type: "boolean", default: false })
    isread!: boolean;

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}