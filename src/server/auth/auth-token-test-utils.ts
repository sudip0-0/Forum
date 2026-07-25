type StoredUser = {
  id: string;
  email?: string;
  emailVerified: Date | null;
  passwordHash?: string | null;
  tokenVersion?: number;
};

type StoredToken = {
  identifier: string;
  token: string;
  expires: Date;
};

type UserUpdateData = {
  passwordHash?: string | null;
  emailVerified?: Date | null;
  tokenVersion?: number | { increment: number };
};

export function createInMemoryAuthDb(seed?: {
  users?: StoredUser[];
  tokens?: StoredToken[];
}) {
  const users = new Map(
    (seed?.users ?? []).map((user) => [
      user.id,
      { tokenVersion: 0, ...user },
    ]),
  );
  const tokens = new Map((seed?.tokens ?? []).map((token) => [token.token, { ...token }]));

  const database = {
    user: {
      async findUnique(args: { where: { id: string }; select?: unknown }) {
        const user = users.get(args.where.id);
        return user ? { ...user } : null;
      },
      async update(args: { where: { id: string }; data: UserUpdateData }) {
        const user = users.get(args.where.id);
        if (!user) throw new Error("user not found");
        const { tokenVersion, ...rest } = args.data;
        Object.assign(user, rest);
        if (typeof tokenVersion === "number") {
          user.tokenVersion = tokenVersion;
        } else if (tokenVersion && typeof tokenVersion.increment === "number") {
          user.tokenVersion = (user.tokenVersion ?? 0) + tokenVersion.increment;
        }
        return { ...user };
      },
    },
    verificationToken: {
      async findUnique(args: { where: { token: string } }) {
        const token = tokens.get(args.where.token);
        return token ? { ...token } : null;
      },
      async delete(args: { where: { token: string } }) {
        const token = tokens.get(args.where.token);
        tokens.delete(args.where.token);
        return token;
      },
      async deleteMany(args: { where: { identifier: string } }) {
        let count = 0;
        for (const [token, record] of tokens.entries()) {
          if (record.identifier === args.where.identifier) {
            tokens.delete(token);
            count++;
          }
        }
        return { count };
      },
      async create(args: { data: StoredToken }) {
        tokens.set(args.data.token, { ...args.data });
        return { ...args.data };
      },
    },
    async $transaction<T>(operations: Promise<T>[]) {
      return Promise.all(operations);
    },
  };

  return { database, users, tokens };
}
