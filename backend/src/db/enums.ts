export const PLATFORM_FEE = 2;
export const DONATION_PLATFORM_FEE = 1.50;

export const ORG_SERVICE_FEE = 0.05;
export const ORG_SHARE = 0.95;

export enum ActiveInactiveStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum GraveStatus {
  ACTIVE = "active",
  FULL = "full",
  MAINTENANCE = "maintenance",
}

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export enum VerificationStatus {
  PENDING = "pending",
  VERIFIED = "verified",
  REJECTED = "rejected",
}

export enum TahlilStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  ACCEPTED = "accepted",
}

export enum QuotationStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  REJECTED = "rejected",
}

export enum NotificationType {
  SUGGESTION = "suggestion",
  DONATION = "donation",
  TAHLILREQUEST = "tahlilrequest",
}

export enum WaqfCategory {
  EDUCATION = "Education",
  MOSQUE = "Mosque",
  HEALTHCARE = "Healthcare",
  ORPHANS = "Orphans",
  WATER = "Water",
  GENERALCHARITY = "General Charity",
}

export enum ProjectStatus {
  PLANNED = "Planned",
  ONGOING = "Ongoing",
  COMPLETED = "Completed",
  ONHOLD = "On Hold",
}

export enum WaqfType {
  CASH = "Cash Waqf",
  PROPERTY = "Property Waqf",
  ASSET = "Asset Waqf",
}

export enum ClaimStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  PAID = "Paid",
}

export enum JenazahCaseStatus {
  PENDING = "pending",
  ONGOING = "ongoing",
  CLOSED = "closed",
  REJECTED = "rejected",
}

export enum OnlineTransactionStatus {
  PENDING = "Pending", // User initiated payment, waiting confirmation
  PAID = "Paid", // Payment successful, money received by platform
  HELD = "Held", // Funds held in middleman account (escrow)
  TRANSFER_PENDING = "Transfer Pending", // Scheduled for payout
  TRANSFERRED = "Transferred", // Successfully paid to recipient
  FAILED = "Failed", // Payment failed
  REFUNDED = "Refunded", // Refunded to payer
}

export type EntityNameGoogleUserRecord = "tahlilrequest" | "donation" | "quotation" | "deathcharity"

// ─── Inventory Module ────────────────────────────────────────────────────────

export enum InventoryItemCategory {
  PERSEDIAAN_JENAZAH = "Persediaan Jenazah",
  PEMBERSIHAN = "Pembersihan",
  MEDICAL_ASET = "Medical & Aset",
}

export enum InventoryItemType {
  ONE_TIME = "CONSUMABLE",
  REUSABLE = "REUSABLE",
}

export enum InventoryUnitType {
  PCS = "pcs",
  SET = "set",
  BOX = "box",
  UNIT = "unit",
}

export enum InventoryItemStatus {
  AVAILABLE = "AVAILABLE",
  LOW_STOCK = "LOW_STOCK",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  IN_USE = "IN_USE",
  MISSING = "MISSING",
  MAINTENANCE = "MAINTENANCE",
}

export enum InventoryPackageGenderType {
  MALE = "MALE",
  FEMALE = "FEMALE",
  ANY = "ANY",
}

export enum InventoryPackageAgeGroup {
  BABY = "BABY",
  CHILD = "CHILD",
  ADULT = "ADULT",
}

export enum InventoryPackageHealthCondition {
  NORMAL = "NORMAL",
  INFECTIOUS = "INFECTIOUS",
  SPECIAL = "SPECIAL",
}

export enum InventoryPackageBodySize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}

export enum InventoryTransactionType {
  STOCK_IN = "STOCK_IN",
  STOCK_OUT = "STOCK_OUT",
  RETURN = "RETURN",
  ADJUSTMENT = "ADJUSTMENT",
}

export enum InventoryTransactionSource {
  RESTOCK = "RESTOCK",
  RETURN = "RETURN",
  MANUAL = "MANUAL",
  KES = "KES",
  AUDIT = "AUDIT",
}

export enum CheckSessionStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

export enum CheckDetailResult {
  MATCH = "MATCH",
  MISSING = "MISSING",
  OVER_COUNT = "OVER_COUNT",
}

export enum CheckItemCondition {
  GOOD = "GOOD",
  DAMAGED = "DAMAGED",
}

export enum CheckReusableStatus {
  AVAILABLE = "AVAILABLE",
  IN_USE = "IN_USE",
  MISSING = "MISSING",
  MAINTENANCE = "MAINTENANCE",
}

