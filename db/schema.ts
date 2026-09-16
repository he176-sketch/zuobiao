import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// One permanent first-pilot budget. Never reset on deployment or by date.
export const trialBudget = sqliteTable("trial_budget", {
  id: text("id").primaryKey(),
  total: integer("total").notNull().default(0),
  lastGlobal: integer("last_global").notNull().default(0),
  used1: integer("used1").notNull().default(0),
  used2: integer("used2").notNull().default(0),
  used3: integer("used3").notNull().default(0),
  used4: integer("used4").notNull().default(0),
  used5: integer("used5").notNull().default(0),
  last1: integer("last1").notNull().default(0),
  last2: integer("last2").notNull().default(0),
  last3: integer("last3").notNull().default(0),
  last4: integer("last4").notNull().default(0),
  last5: integer("last5").notNull().default(0),
}, t => [check("trial_fixed_budget", sql`${t.id} = 'first-50' AND ${t.total} BETWEEN 0 AND 50 AND ${t.used1} BETWEEN 0 AND 10 AND ${t.used2} BETWEEN 0 AND 10 AND ${t.used3} BETWEEN 0 AND 10 AND ${t.used4} BETWEEN 0 AND 10 AND ${t.used5} BETWEEN 0 AND 10 AND ${t.total} = ${t.used1}+${t.used2}+${t.used3}+${t.used4}+${t.used5}`)]);
