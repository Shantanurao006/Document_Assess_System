import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

const routes = [
  "/register",
  "/login",
  "/user/dashboard",
  "/user/my-documents",
  "/admin/dashboard",
];

const distDir = join(process.cwd(), "dist");
const indexPath = join(distDir, "index.html");

for (const route of routes) {
  const fallbackPath = join(distDir, route, "index.html");
  mkdirSync(dirname(fallbackPath), { recursive: true });
  copyFileSync(indexPath, fallbackPath);
}
