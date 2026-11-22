import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { jwt } from "better-auth/plugins";
import { ObjectId } from "mongodb";
import { getDB, getMongoClient } from "./mongodb";

export type PizzaHubRole = "customer" | "vendor" | "admin";
export type PublicRegistrationRole = "customer" | "vendor";
export type SubscriptionPlan = "free" | "premium";

const PUBLIC_REGISTRATION_ROLES = new Set<PublicRegistrationRole>([
  "customer",
  "vendor",
]);

const PROTECTED_USER_UPDATE_FIELDS = [
  "role",
  "isBlocked",
  "subscriptionPlan",
  "subscriptionExpiresAt",
] as const;

const PASSWORD_COMPLEXITY_ERROR =
  "Password must be at least 6 characters long and contain at least one uppercase letter and one lowercase letter.";

function normalizeOrigin(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function getRequiredAuthSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "Missing required environment variable BETTER_AUTH_SECRET. Set BETTER_AUTH_SECRET in .env before starting the application.",
    );
  }
  return secret;
}

function getAuthBaseUrl(): string {
  const configuredUrl =
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim();

  if (!configuredUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "Missing required environment variable BETTER_AUTH_URL in production.",
      );
    }
    return "http://localhost:3000";
  }

  return normalizeOrigin(configuredUrl);
}

function getTrustedOrigins(baseUrl: string): string[] {
  const candidates = [
    baseUrl,
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL?.trim(),
    ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(",") ?? []),
  ];

  if (process.env.NODE_ENV !== "production") {
    candidates.push("http://localhost:3000", "http://127.0.0.1:3000");
  }

  const normalized = candidates
    .map((origin) => origin?.trim())
    .filter((origin): origin is string => Boolean(origin))
    .map(normalizeOrigin);

  return Array.from(new Set(normalized));
}

function getSocialProviders() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return undefined;
  }

  return {
    google: {
      clientId,
      clientSecret,
    },
  };
}

function isValidPasswordComplexity(password: string): boolean {
  return (
    password.length >= 6 && /[A-Z]/.test(password) && /[a-z]/.test(password)
  );
}

function resolvePublicRegistrationRole(
  rawRole: unknown,
): PublicRegistrationRole {
  if (rawRole === undefined || rawRole === null || rawRole === "") {
    return "customer";
  }

  if (typeof rawRole !== "string") {
    throw new APIError("BAD_REQUEST", {
      message:
        "Invalid account role. Only customer or vendor accounts can be registered publicly.",
    });
  }

  const normalizedRole = rawRole.trim().toLowerCase();
  if (
    !PUBLIC_REGISTRATION_ROLES.has(normalizedRole as PublicRegistrationRole)
  ) {
    throw new APIError("BAD_REQUEST", {
      message:
        "Invalid account role. Only customer or vendor accounts can be registered publicly.",
    });
  }

  return normalizedRole as PublicRegistrationRole;
}

export const AUTH_BASE_URL = getAuthBaseUrl();

const authSecret = getRequiredAuthSecret();
const client = getMongoClient();
const db = getDB();

export const auth = betterAuth({
  appName: "PizzaHub",
  baseURL: AUTH_BASE_URL,
  secret: authSecret,
  trustedOrigins: getTrustedOrigins(AUTH_BASE_URL),
  database: mongodbAdapter(db, {
    client,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  socialProviders: getSocialProviders(),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: true,
      },
      isBlocked: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      businessName: {
        type: "string",
        required: false,
        defaultValue: "",
        input: true,
      },
      subscriptionPlan: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false,
      },
      subscriptionExpiresAt: {
        type: "date",
        required: false,
        defaultValue: null,
        input: false,
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const body =
        typeof ctx.body === "object" && ctx.body !== null
          ? (ctx.body as Record<string, unknown>)
          : undefined;

      if (!body) {
        return;
      }

      if (ctx.path === "/sign-up/email") {
        const password = body.password;
        if (
          typeof password !== "string" ||
          !isValidPasswordComplexity(password)
        ) {
          throw new APIError("BAD_REQUEST", {
            message: PASSWORD_COMPLEXITY_ERROR,
          });
        }
      }

      if (
        ctx.path === "/change-password" ||
        ctx.path === "/reset-password" ||
        ctx.path === "/set-password"
      ) {
        const newPassword = body.newPassword;
        if (
          typeof newPassword !== "string" ||
          !isValidPasswordComplexity(newPassword)
        ) {
          throw new APIError("BAD_REQUEST", {
            message: PASSWORD_COMPLEXITY_ERROR,
          });
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const resolvedRole = resolvePublicRegistrationRole(user.role);
          const resolvedBusinessName =
            resolvedRole === "vendor" && typeof user.businessName === "string"
              ? user.businessName.trim()
              : "";

          return {
            data: {
              ...user,
              role: resolvedRole,
              isBlocked: false,
              businessName: resolvedBusinessName,
              subscriptionPlan: "free",
              subscriptionExpiresAt: null,
            },
          };
        },
      },
      update: {
        before: async (user, context) => {
          const hasProtectedField = PROTECTED_USER_UPDATE_FIELDS.some(
            (field) => field in user && user[field] !== undefined,
          );

          if (context?.path === "/update-user" && hasProtectedField) {
            throw new APIError("FORBIDDEN", {
              message: "Protected account fields cannot be modified directly.",
            });
          }

          const sanitizedData: Record<string, unknown> = { ...user };
          for (const field of PROTECTED_USER_UPDATE_FIELDS) {
            delete sanitizedData[field];
          }

          return {
            data: sanitizedData,
          };
        },
      },
    },
    session: {
      create: {
        before: async (session, context) => {
          let existingUser: { isBlocked?: boolean } | null = null;

          if (context?.context?.internalAdapter) {
            const foundUser =
              await context.context.internalAdapter.findUserById(
                session.userId,
              );
            existingUser = foundUser as { isBlocked?: boolean } | null;
          } else {
            const filter = ObjectId.isValid(session.userId)
              ? { _id: new ObjectId(session.userId) }
              : ({ _id: session.userId } as unknown as { _id: ObjectId });
            existingUser = await db
              .collection<{ _id: ObjectId; isBlocked?: boolean }>("users")
              .findOne(filter, { projection: { isBlocked: 1 } });
          }

          if (existingUser?.isBlocked === true) {
            throw new APIError("FORBIDDEN", {
              message:
                "Your account has been blocked. Please contact an administrator.",
            });
          }
        },
      },
    },
  },
  plugins: [
    // Asymmetric EdDSA (Ed25519) JWTs verified by the Express backend via /api/auth/jwks.
    // Express independently fetches current role & isBlocked from MongoDB `users` by `sub`.
    jwt({
      jwks: {
        keyPairConfig: {
          alg: "EdDSA",
          crv: "Ed25519",
        },
        disablePrivateKeyEncryption: false,
        jwksPath: "/jwks",
      },
      jwt: {
        issuer: AUTH_BASE_URL,
        audience: AUTH_BASE_URL,
        expirationTime: "15m",
        definePayload: ({ user }) => ({
          sub: user.id,
          email: user.email,
        }),
      },
    }),
    // nextCookies must stay last in plugins for Next.js cookie propagation.
    nextCookies(),
  ],
});

export type Auth = typeof auth;
