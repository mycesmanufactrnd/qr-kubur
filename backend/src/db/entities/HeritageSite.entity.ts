import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("heritagesite")
export class HeritageSite {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255 })
    name!: string;

    @Column("varchar", { length: 255, nullable: true })
    era?: string;

    @Column("text", { nullable: true })
    eradescription?: string;

    @Column("text", { nullable: true })
    description?: string;

    @Column("text", { nullable: true })
    historicalsources?: string;

    @Column("double precision", { nullable: true })
    latitude?: number;

    @Column("double precision", { nullable: true })
    longitude?: number;

    @Column("varchar", { length: 255, nullable: true })
    photourl?: string;

    @Column("varchar", { length: 255, nullable: true })
    address?: string;

    @Column("varchar", { length: 255, nullable: true })
    state?: string;

    @Column("varchar", { length: 255, nullable: true })
    url?: string;

    @Column("int", { default: 0 })
    viewcount!: number;

    @Column("boolean", { default: false })
    isfeatured!: boolean;

    @CreateDateColumn()
    createdat!: Date;
}
