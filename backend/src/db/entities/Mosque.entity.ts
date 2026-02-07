import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  ManyToOne, 
  JoinColumn, 
  OneToMany 
} from "typeorm";
import { Organisation } from "./Organisation.entity.ts";
import { User } from "./User.entity.ts";
import { ActivityPost } from "./ActivityPosts.entity.ts";

@Entity("mosque")
export class Mosque {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("varchar", { length: 255 })
  name!: string;

  @Column("varchar", { length: 255 })
  state!: string;

  @Column("text", { nullable: true })
  address?: string;

  @Column("varchar", { length: 255, nullable: true })
  phone?: string;
  
  @Column("varchar", { length: 255, nullable: true })
  email?: string;
  
  @Column("varchar", { length: 255, nullable: true })
  url?: string;

  @Column("double precision", { nullable: true })
  latitude?: number;

  @Column("double precision", { nullable: true })
  longitude?: number;

  @ManyToOne(() => Organisation, (organisation) => organisation.mosques, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "organisationid" })
  organisation?: Organisation | null;

  @OneToMany(() => User, (user) => user.mosque)
  users!: User[];
  
  @OneToMany(() => ActivityPost, (activitypost) => activitypost.mosque) 
  activityposts!: ActivityPost[];

  @CreateDateColumn({ name: "createdat" })
  createdat!: Date;

  @Column("varchar", { length: 255, nullable: true })
  photourl?: string; 
} 