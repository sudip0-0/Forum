import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { UserRole } from "@prisma/client";
import type { db as dbType } from "@/server/db/prisma";

export interface TrpcSession {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
  };
  expires: string;
}

export interface TrpcContext {
  db: typeof dbType;
  session: TrpcSession | null;
}

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    if (error.cause instanceof ZodError) {
      return {
        ...shape,
        data: {
          ...shape.data,
          code: "BAD_REQUEST",
          zodErrors: error.cause.flatten().fieldErrors,
        },
      };
    }

    return {
      ...shape,
      data: {
        ...shape.data,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export function roleProcedure(allowedRoles: UserRole[]) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!allowedRoles.includes(ctx.session.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return next();
  });
}
