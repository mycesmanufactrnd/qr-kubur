// @ts-nocheck
import {
  Column,
  DeleteDateColumn,
  BeforeSoftRemove,
} from "typeorm";
import { AuditableEntity } from "./AuditableEntity.js";
import { getCurrentUserId } from "../../../helpers/requestContext.js";

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
