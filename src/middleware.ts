import NextAuth from "next-auth";
import { edgeAuthConfig } from "@/server/auth/auth.config";

export default NextAuth(edgeAuthConfig).auth;

export const config = {
  matcher: ["/admin/:path*"],
};
