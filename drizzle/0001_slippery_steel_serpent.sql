PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_trial_budget` (
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
	CONSTRAINT "trial_usage_accounting" CHECK("__new_trial_budget"."id" = 'first-50' AND "__new_trial_budget"."total" >= 0 AND "__new_trial_budget"."used1" >= 0 AND "__new_trial_budget"."used2" >= 0 AND "__new_trial_budget"."used3" >= 0 AND "__new_trial_budget"."used4" >= 0 AND "__new_trial_budget"."used5" >= 0 AND "__new_trial_budget"."total" = "__new_trial_budget"."used1"+"__new_trial_budget"."used2"+"__new_trial_budget"."used3"+"__new_trial_budget"."used4"+"__new_trial_budget"."used5")
);
--> statement-breakpoint
INSERT INTO `__new_trial_budget`("id", "total", "last_global", "used1", "used2", "used3", "used4", "used5", "last1", "last2", "last3", "last4", "last5") SELECT "id", "total", "last_global", "used1", "used2", "used3", "used4", "used5", "last1", "last2", "last3", "last4", "last5" FROM `trial_budget`;--> statement-breakpoint
DROP TABLE `trial_budget`;--> statement-breakpoint
ALTER TABLE `__new_trial_budget` RENAME TO `trial_budget`;--> statement-breakpoint
PRAGMA foreign_keys=ON;