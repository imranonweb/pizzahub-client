import { ApiClientError, apiRequest } from "./api-client";
import { authClient, getAuthToken } from "./auth-client";
import type { ContactProfileValues } from "./profile-validation";

export interface AuthMutationResult {
  ok: boolean;
  message: string;
}

export interface CustomerContactProfileResponse {
  source: "live" | "unavailable";
  profile: ContactProfileValues | null;
  notice?: string;
}

export type ContactUpdateResult =
  | {
      ok: true;
      profile: ContactProfileValues;
      message: string;
    }
  | {
      ok: false;
      reason: "backend-unavailable" | "unauthorized" | "error";
      message: string;
    };

const PROFILE_API_UNAVAILABLE_NOTICE =
  "Unable to reach the PizzaHub profile API (/api/profile). Name and avatar updates remain available via your session, or retry in a moment.";

export async function updateAccountProfile(input: {
  name: string;
  image: string | null;
}): Promise<AuthMutationResult> {
  try {
    const { error } = await authClient.updateUser({
      name: input.name,
      image: input.image,
    });

    if (error) {
      return {
        ok: false,
        message: error.message || "Unable to update profile details.",
      };
    }

    return {
      ok: true,
      message: "Your profile details were saved.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Network error while saving your profile.",
    };
  }
}

export async function changeAccountPassword(input: {
  currentPassword: string;
  newPassword: string;
  revokeOtherSessions: boolean;
}): Promise<AuthMutationResult> {
  try {
    const { error } = await authClient.changePassword({
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
      revokeOtherSessions: input.revokeOtherSessions,
    });

    if (error) {
      const msg = error.message || "Unable to change your password.";
      if (/credential account|no password/i.test(msg)) {
        return {
          ok: false,
          message:
            "This account uses Google sign-in and does not currently have an email password set.",
        };
      }
      return {
        ok: false,
        message: msg,
      };
    }

    return {
      ok: true,
      message: input.revokeOtherSessions
        ? "Password updated and other active sessions signed out."
        : "Your password was updated successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Network error while changing password.",
    };
  }
}

async function getBearerHeaders(): Promise<Record<string, string> | null> {
  const token = await getAuthToken().catch(() => null);
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchCustomerContactProfile(): Promise<CustomerContactProfileResponse> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      source: "unavailable",
      profile: null,
      notice:
        "Unable to issue an API token for your current session. Sign out and sign in again if this persists.",
    };
  }

  try {
    const payload = await apiRequest<{
      profile?: Record<string, unknown>;
      data?: Record<string, unknown>;
      contactPhone?: unknown;
      deliveryAddress?: unknown;
    }>("/api/profile", { headers: authHeaders });

    const source = payload.profile ?? payload.data ?? payload;
    return {
      source: "live",
      profile: {
        contactPhone:
          typeof source.contactPhone === "string" ? source.contactPhone : "",
        deliveryAddress:
          typeof source.deliveryAddress === "string"
            ? source.deliveryAddress
            : "",
      },
    };
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.isRouteNotFound || error.isNetworkError)
    ) {
      return {
        source: "unavailable",
        profile: null,
        notice: PROFILE_API_UNAVAILABLE_NOTICE,
      };
    }

    throw error;
  }
}

export async function updateCustomerContactProfile(
  values: ContactProfileValues,
): Promise<ContactUpdateResult> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "Your session expired. Sign in again to save delivery details.",
    };
  }

  try {
    const payload = await apiRequest<{
      profile?: Record<string, unknown>;
      data?: Record<string, unknown>;
      message?: string;
    }>("/api/profile", {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    const source = payload.profile ?? payload.data ?? {};
    return {
      ok: true,
      profile: {
        contactPhone:
          typeof source.contactPhone === "string"
            ? source.contactPhone
            : values.contactPhone,
        deliveryAddress:
          typeof source.deliveryAddress === "string"
            ? source.deliveryAddress
            : values.deliveryAddress,
      },
      message: payload.message || "Contact & delivery details saved.",
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.isRouteNotFound || error.isNetworkError) {
        return {
          ok: false,
          reason: "backend-unavailable",
          message: PROFILE_API_UNAVAILABLE_NOTICE,
        };
      }
      if (error.status === 401 || error.status === 403) {
        return {
          ok: false,
          reason: "unauthorized",
          message: error.message,
        };
      }
      return {
        ok: false,
        reason: "error",
        message: error.message,
      };
    }

    return {
      ok: false,
      reason: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to save delivery profile.",
    };
  }
}

export interface VendorBusinessProfileValues {
  businessName: string;
  contactPhone: string;
  deliveryAddress: string;
}

export interface VendorBusinessProfileResponse {
  source: "live" | "unavailable";
  profile: VendorBusinessProfileValues | null;
  notice?: string;
}

export type VendorBusinessProfileUpdateResult =
  | {
      ok: true;
      profile: VendorBusinessProfileValues;
      message: string;
    }
  | {
      ok: false;
      reason: "backend-unavailable" | "unauthorized" | "error";
      message: string;
    };

export async function fetchVendorBusinessProfile(): Promise<VendorBusinessProfileResponse> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      source: "unavailable",
      profile: null,
      notice:
        "Unable to issue an API token for your current session. Sign out and sign in again if this persists.",
    };
  }

  try {
    const payload = await apiRequest<{
      profile?: Record<string, unknown>;
      data?: Record<string, unknown>;
      businessName?: unknown;
      contactPhone?: unknown;
      deliveryAddress?: unknown;
    }>("/api/profile", { headers: authHeaders });

    const source = payload.profile ?? payload.data ?? payload;
    return {
      source: "live",
      profile: {
        businessName:
          typeof source.businessName === "string" ? source.businessName : "",
        contactPhone:
          typeof source.contactPhone === "string" ? source.contactPhone : "",
        deliveryAddress:
          typeof source.deliveryAddress === "string"
            ? source.deliveryAddress
            : "",
      },
    };
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      (error.isRouteNotFound || error.isNetworkError)
    ) {
      return {
        source: "unavailable",
        profile: null,
        notice: PROFILE_API_UNAVAILABLE_NOTICE,
      };
    }

    throw error;
  }
}

export async function updateVendorBusinessProfile(
  values: VendorBusinessProfileValues,
): Promise<VendorBusinessProfileUpdateResult> {
  const authHeaders = await getBearerHeaders();
  if (!authHeaders) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "Your session expired. Sign in again to save kitchen details.",
    };
  }

  try {
    const payload = await apiRequest<{
      profile?: Record<string, unknown>;
      data?: Record<string, unknown>;
      message?: string;
    }>("/api/profile", {
      method: "PATCH",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        businessName: values.businessName.trim(),
        contactPhone: values.contactPhone.trim(),
        deliveryAddress: values.deliveryAddress.trim(),
      }),
    });

    const source = payload.profile ?? payload.data ?? {};
    return {
      ok: true,
      profile: {
        businessName:
          typeof source.businessName === "string"
            ? source.businessName
            : values.businessName.trim(),
        contactPhone:
          typeof source.contactPhone === "string"
            ? source.contactPhone
            : values.contactPhone.trim(),
        deliveryAddress:
          typeof source.deliveryAddress === "string"
            ? source.deliveryAddress
            : values.deliveryAddress.trim(),
      },
      message: payload.message || "Kitchen profile details saved.",
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (error.isRouteNotFound || error.isNetworkError) {
        return {
          ok: false,
          reason: "backend-unavailable",
          message: PROFILE_API_UNAVAILABLE_NOTICE,
        };
      }
      if (error.status === 401 || error.status === 403) {
        return {
          ok: false,
          reason: "unauthorized",
          message: error.message,
        };
      }
      return {
        ok: false,
        reason: "error",
        message: error.message,
      };
    }

    return {
      ok: false,
      reason: "error",
      message:
        error instanceof Error
          ? error.message
          : "Unable to save kitchen profile.",
    };
  }
}
