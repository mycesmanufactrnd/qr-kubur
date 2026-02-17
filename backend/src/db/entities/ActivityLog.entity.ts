import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("activitylog")
export class ActivityLog {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column("varchar", { length: 255, nullable: true })
    activitytype?: string | null;
    // define which activity
    
    @Column("varchar", { length: 255, nullable: true })
    functionname?: string | null;
    // define which function it call from
    
    @Column("varchar", { length: 255, nullable: true })
    useremail?: string | null;
    
    @Column("varchar", { length: 255, nullable: true })
    level?: string | null;
    // info, warn, error, debug
    
    @Column("text", { nullable: true })
    summary?: string | null;
    // messages, if error, use error message at catch
    
    @Column("text", { nullable: true })
    extramessage?: string | null;
    // extra messages, if error, use error message at catch

    @CreateDateColumn({ name: "createdat" })
    createdat!: Date;
}