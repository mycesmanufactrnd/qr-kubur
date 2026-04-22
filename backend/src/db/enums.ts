export const PLATFORM_FEE = 2;

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
  REJECTED = "rejected",
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

export enum OnlineTransactionStatus {
  PENDING = "Pending", // User initiated payment, waiting confirmation
  PAID = "Paid", // Payment successful, money received by platform
  HELD = "Held", // Funds held in middleman account (escrow)
  TRANSFER_PENDING = "Transfer Pending", // Scheduled for payout
  TRANSFERRED = "Transferred", // Successfully paid to recipient
  FAILED = "Failed", // Payment failed
  REFUNDED = "Refunded", // Refunded to payer
}
