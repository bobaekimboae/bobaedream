import { AdminDatabase } from "./database.mjs";

const force = process.argv.includes("--force");
const database = new AdminDatabase();
const seeded = database.seed({ force });
console.log(seeded ? "Category admin seed completed." : "Seed skipped: data already exists.");
database.close();
