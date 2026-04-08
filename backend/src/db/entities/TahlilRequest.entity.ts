import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { TahfizCenter } from "./TahfizCenter.entity.ts";
import { TahlilStatus } from "../enums.ts";

@Entity("tahlilrequest")
export class TahlilRequest {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255, nullable: true })
    requestorname?: string;

    @Column("varchar", { length: 255, nullable: true })
    requestorphoneno?: string;
    
    @Column("varchar", { length: 255, nullable: true })
    requestoremail?: string;

    @Column("text", { array: true, nullable: true })
    deceasednames?: string[];

    @Column("text", { array: true, nullable: true })
    selectedservices?: string[];

    @ManyToOne(() => TahfizCenter, (tahfizcenter) => tahfizcenter.tahlilrequests, {
        nullable: true,
        onDelete: "SET NULL",
    })
    tahfizcenter?: TahfizCenter | null;

    @Column("text", { nullable: true })
    customservice?: string;

    @Column("varchar", { length: 255, nullable: true })
    referenceno?: string;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    serviceamount?: number;
    
    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    platformfeeamount?: number;

    @Column({
        type: "enum",
        enum: TahlilStatus,
        default: TahlilStatus.PENDING,
    })
    status!: TahlilStatus;

    @Column("text", { nullable: true })
    liveurl?: string;

    @Column({ type: "date", nullable: true })
    suggesteddate?: Date;

    @Column("text", { array: true, nullable: true })
    photourls?: string[];

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}
