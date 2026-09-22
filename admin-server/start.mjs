import { createServer } from "node:http";
import { createAdminApp } from "./app.mjs";

const port = Number(process.env.ADMIN_PORT || 8788);
const host = process.env.ADMIN_HOST || "127.0.0.1";
const app = createAdminApp();
const server = createServer(app);

server.listen(port, host, () => {
  console.log(`Bobaedream category admin: http://${host}:${port}/category-admin/`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      app.database.close();
      process.exit(0);
    });
  });
}
