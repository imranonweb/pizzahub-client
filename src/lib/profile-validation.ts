export interface ProfileEditValues {
  name: string;
  image: string;
}

export type ProfileEditField = keyof ProfileEditValues;
export type ProfileEditErrors = Partial<Record<ProfileEditField, string>>;

export interface PasswordChangeValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  revokeOtherSessions: boolean;
}

export type PasswordChangeField =
  | "currentPassword"
  | "newPassword"
  | "confirmPassword";
export type PasswordChangeErrors = Partial<Record<PasswordChangeField, string>>;

export interface ContactProfileValues {
  contactPhone: string;
  deliveryAddress: string;
}

export type ContactProfileField = keyof ContactProfileValues;
export type ContactProfileErrors = Partial<Record<ContactProfileField, string>>;

function isValidAvatarInput(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  if (trimmed.length > 500) return false;
  if (trimmed.startsWith("/images/")) return true;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateProfileEditValues(values: ProfileEditValues): {
  valid: boolean;
  errors: ProfileEditErrors;
  sanitized?: { name: string; image: string | null };
} {
  const errors: ProfileEditErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = "Enter your full name.";
  } else if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (name.length > 80) {
    errors.name = "Name must be 80 characters or fewer.";
  }

  const image = values.image.trim();
  if (image && !isValidAvatarInput(image)) {
    errors.image =
      "Enter a valid https:// image URL (up to 500 characters), or leave blank.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      name,
      image: image || null,
    },
  };
}

export function getPasswordComplexityState(password: string) {
  return {
    minLength: password.length >= 6,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
  };
}

export function validatePasswordChangeValues(values: PasswordChangeValues): {
  valid: boolean;
  errors: PasswordChangeErrors;
} {
  const errors: PasswordChangeErrors = {};

  if (!values.currentPassword) {
    errors.currentPassword = "Enter your current password.";
  }

  const complexity = getPasswordComplexityState(values.newPassword);
  if (!values.newPassword) {
    errors.newPassword = "Enter a new password.";
  } else if (
    !complexity.minLength ||
    !complexity.hasUppercase ||
    !complexity.hasLowercase
  ) {
    errors.newPassword =
      "Password must be at least 6 characters with uppercase and lowercase letters.";
  } else if (
    values.currentPassword &&
    values.newPassword === values.currentPassword
  ) {
    errors.newPassword = "New password must differ from your current password.";
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your new password.";
  } else if (values.confirmPassword !== values.newPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateContactProfileValues(values: ContactProfileValues): {
  valid: boolean;
  errors: ContactProfileErrors;
  sanitized?: ContactProfileValues;
} {
  const errors: ContactProfileErrors = {};

  const contactPhone = values.contactPhone.trim();
  const digits = contactPhone.replace(/\D/g, "");
  if (!contactPhone) {
    errors.contactPhone = "Enter a contact phone number.";
  } else if (!/^[+\d().\-\s]{7,20}$/.test(contactPhone) || digits.length < 7) {
    errors.contactPhone = "Enter a valid phone number (7 to 20 characters).";
  }

  const deliveryAddress = values.deliveryAddress.trim();
  if (!deliveryAddress) {
    errors.deliveryAddress = "Enter your saved delivery address.";
  } else if (deliveryAddress.length < 8) {
    errors.deliveryAddress = "Delivery address must be at least 8 characters.";
  } else if (deliveryAddress.length > 240) {
    errors.deliveryAddress =
      "Delivery address must be 240 characters or fewer.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      contactPhone,
      deliveryAddress,
    },
  };
}
