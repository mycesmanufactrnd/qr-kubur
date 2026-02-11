import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { TahfizCenter } from './TahfizCenter.entity.ts';
import { Mosque } from './Mosque.entity.ts';

@Entity('activitypost')
export class ActivityPost {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  title!: string;

  @Column('text')
  content!: string;

  @Column({ type: 'varchar', nullable: true })
  photourl?: string;

  @Column({ type: 'boolean', default: true })
  ispublished!: boolean;

  @ManyToOne(() => Mosque, (mosque) => mosque.activityposts, {
    nullable: true,
    onDelete: "SET NULL",
  })
  mosque?: Mosque | null;

  @ManyToOne(() => TahfizCenter, (tahfiz) => tahfiz.activityposts, {
    nullable: true,
    onDelete: "SET NULL",
  })
  tahfiz?: TahfizCenter | null;

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @UpdateDateColumn({ name: "updatedat" })
  updatedat!: Date;
}