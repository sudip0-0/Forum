import { execSync } from "node:child_process";

export default function globalSetup() {
  execSync("pnpm db:seed", { stdio: "inherit" });
}
