import { spawnSync } from "node:child_process";

const result = spawnSync("python", ["scripts/truck_qf_images_v01.py"], { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
