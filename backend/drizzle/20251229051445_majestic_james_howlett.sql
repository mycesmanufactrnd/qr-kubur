CREATE TABLE "cemeteries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"location" text
);
--> statement-breakpoint
CREATE TABLE "kubur" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"qr_code" varchar(100),
	"deceased_name" varchar(255),
	"cemetery_id" uuid,
	"lat" double precision,
	"lng" double precision,
	CONSTRAINT "kubur_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255),
	"password_hash" text,
	"role" varchar(20) DEFAULT 'public',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "kubur" ADD CONSTRAINT "kubur_cemetery_id_cemeteries_id_fk" FOREIGN KEY ("cemetery_id") REFERENCES "public"."cemeteries"("id") ON DELETE no action ON UPDATE no action;