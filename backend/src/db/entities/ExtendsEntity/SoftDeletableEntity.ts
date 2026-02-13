import {
  Column,
  DeleteDateColumn,
  BeforeSoftRemove,
} from "typeorm";
import { AuditableEntity } from "./AuditableEntity.ts";
import { getCurrentUserId } from "../../../helpers/requestContext.ts";

export abstract class SoftDeletableEntity extends AuditableEntity {
  @DeleteDateColumn({ name: "deletedat" })
  deletedat?: Date | null;

  @Column("int", { nullable: true })
  deletedby?: number | null;

  @BeforeSoftRemove()
  setDeletedBy() {
    const userId = getCurrentUserId();
    if (userId) {
      this.deletedby = userId;
    }
  }
}
