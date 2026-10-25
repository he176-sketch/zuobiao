CREATE TABLE `trial_budget` (
	`id` text PRIMARY KEY NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`last_global` integer DEFAULT 0 NOT NULL,
	`used1` integer DEFAULT 0 NOT NULL,
	`used2` integer DEFAULT 0 NOT NULL,
	`used3` integer DEFAULT 0 NOT NULL,
	`used4` integer DEFAULT 0 NOT NULL,
	`used5` integer DEFAULT 0 NOT NULL,
	`last1` integer DEFAULT 0 NOT NULL,
	`last2` integer DEFAULT 0 NOT NULL,
	`last3` integer DEFAULT 0 NOT NULL,
	`last4` integer DEFAULT 0 NOT NULL,
	`last5` integer DEFAULT 0 NOT NULL,
	CONSTRAINT "trial_fixed_budget" CHECK("trial_budget"."id" = 'first-50' AND "trial_budget"."total" BETWEEN 0 AND 50 AND "trial_budget"."used1" BETWEEN 0 AND 10 AND "trial_budget"."used2" BETWEEN 0 AND 10 AND "trial_budget"."used3" BETWEEN 0 AND 10 AND "trial_budget"."used4" BETWEEN 0 AND 10 AND "trial_budget"."used5" BETWEEN 0 AND 10 AND "trial_budget"."total" = "trial_budget"."used1"+"trial_budget"."used2"+"trial_budget"."used3"+"trial_budget"."used4"+"trial_budget"."used5")
);

--> statement-breakpoint
-- Initialize the single permanent budget once. Missing rows fail closed at runtime.
INSERT INTO trial_budget (id) VALUES ('first-50');
