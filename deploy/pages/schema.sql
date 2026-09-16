-- Current application schema for a new standalone Pages database.
-- Import the preserved usage row separately while the old AI is paused.
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
	CONSTRAINT "trial_usage_accounting" CHECK("trial_budget"."id" = 'first-50' AND "trial_budget"."total" >= 0 AND "trial_budget"."used1" >= 0 AND "trial_budget"."used2" >= 0 AND "trial_budget"."used3" >= 0 AND "trial_budget"."used4" >= 0 AND "trial_budget"."used5" >= 0 AND "trial_budget"."total" = "trial_budget"."used1"+"trial_budget"."used2"+"trial_budget"."used3"+"trial_budget"."used4"+"trial_budget"."used5")
);
