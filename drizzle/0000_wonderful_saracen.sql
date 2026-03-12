CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"updated_from" varchar(255) DEFAULT 'unknown' NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
