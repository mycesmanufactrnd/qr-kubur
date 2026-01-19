import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TahfizCenter } from "./TahfizCenter.entity.ts";
import { TahlilStatus } from "../enums.ts";

@Entity("tahlilrequest")
export class TahlilRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255 })
    requestorname!: string;

    @Column("varchar", { length: 255 })
    requestorphoneno!: string;
    
    @Column("varchar", { length: 255, nullable: true })
    requestoremail?: string;

    @Column("text", { array: true, nullable: true })
    deceasednames?: string[];

    @Column("text", { array: true, nullable: true })
    selectedservices?: string[];

    @Column({ type: "date", nullable: true })
    preferreddate?: Date;

    @ManyToOne(() => TahfizCenter, (tahfizcenter) => tahfizcenter.tahlilrequests, {
        nullable: true,
        onDelete: "SET NULL",
    })
    tahfizcenter?: TahfizCenter | null;

    @Column("text", { nullable: true })
    notes?: string;

    @Column({
        type: "enum",
        enum: TahlilStatus,
        default: TahlilStatus.PENDING,
    })
    status!: TahlilStatus;

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}