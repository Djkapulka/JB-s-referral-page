import { z } from "zod";

export const SERVICE_TYPES = [
  "HOUSE_WASHING",
  "WINDOW_CLEANING",
  "PRESSURE_WASHING",
  "GUTTER_CLEANING",
  "ROOF_WASHING",
  "OTHER",
] as const;

export const SERVICE_LABELS: Record<(typeof SERVICE_TYPES)[number], string> = {
  HOUSE_WASHING: "House Washing",
  WINDOW_CLEANING: "Window Cleaning",
  PRESSURE_WASHING: "Pressure Washing",
  GUTTER_CLEANING: "Gutter Cleaning",
  ROOF_WASHING: "Roof Washing",
  OTHER: "Other",
};

// Loose but sane phone check — accepts common US formats, doesn't try to be
// a full E.164 validator.
const phoneRegex = /^[\d\s()+.-]{7,20}$/;

export const referralFormSchema = z.object({
  referralCode: z.string().min(1).max(64),
  leadFirstName: z.string().trim().min(1, "First name is required").max(80),
  leadLastName: z.string().trim().min(1, "Last name is required").max(80),
  leadPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20)
    .regex(phoneRegex, "Enter a valid phone number"),
  leadEmail: z.string().trim().email("Enter a valid email").max(254),
  leadAddress: z.string().trim().min(1, "Address is required").max(160),
  leadCity: z.string().trim().min(1, "City is required").max(80),
  leadZip: z
    .string()
    .trim()
    .min(3, "Enter a valid ZIP code")
    .max(12),
  serviceRequested: z.enum(SERVICE_TYPES),
  consentGiven: z.literal(true, {
    message: "Consent is required to submit a referral",
  }),
  // Honeypot field — real users never see or fill this in. Deliberately not
  // constrained to empty here; the route handler checks it and returns a
  // fake success so bots can't distinguish a honeypot rejection from a real
  // validation error.
  companyWebsite: z.string().max(500).optional().or(z.literal("")),
  turnstileToken: z.string().optional(),
});

export type ReferralFormInput = z.infer<typeof referralFormSchema>;

// Public "Refer a Friend" form — unlike the personalized-link form above,
// the referrer isn't already known from a referral code, so their identity
// is collected too. Only name is strictly required for each person; contact
// info requires at least one of email/phone, per the product spec.
export const publicReferralFormSchema = z
  .object({
    referrerFirstName: z.string().trim().min(1, "First name is required").max(80),
    referrerLastName: z.string().trim().min(1, "Last name is required").max(80),
    referrerEmail: z.string().trim().email("Enter a valid email").max(254).optional().or(z.literal("")),
    referrerPhone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(20)
      .regex(phoneRegex, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),

    leadFirstName: z.string().trim().min(1, "Friend's first name is required").max(80),
    leadLastName: z.string().trim().min(1, "Friend's last name is required").max(80),
    leadEmail: z.string().trim().email("Enter a valid email").max(254).optional().or(z.literal("")),
    leadPhone: z
      .string()
      .trim()
      .min(7, "Enter a valid phone number")
      .max(20)
      .regex(phoneRegex, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),
    serviceRequested: z.enum(SERVICE_TYPES),
    leadAddress: z.string().trim().max(160).optional().or(z.literal("")),
    leadCity: z.string().trim().max(80).optional().or(z.literal("")),
    leadZip: z.string().trim().max(12).optional().or(z.literal("")),

    consentGiven: z.literal(true, {
      message: "Please confirm you have permission to share your friend's information",
    }),
    // Honeypot — same pattern as referralFormSchema above.
    companyWebsite: z.string().max(500).optional().or(z.literal("")),
    turnstileToken: z.string().optional(),
  })
  .refine((data) => Boolean(data.referrerEmail) || Boolean(data.referrerPhone), {
    message: "Enter your email or phone number",
    path: ["referrerEmail"],
  })
  .refine((data) => Boolean(data.leadEmail) || Boolean(data.leadPhone), {
    message: "Enter your friend's email or phone number",
    path: ["leadEmail"],
  });

export type PublicReferralFormInput = z.infer<typeof publicReferralFormSchema>;

export const verifyReferralSchema = z.union([
  z.object({ customerId: z.string().trim().min(1) }),
  z.object({
    createCustomer: z.object({
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().min(1).max(80),
      email: z.string().trim().email().optional().or(z.literal("")),
      phone: z.string().trim().max(20).optional().or(z.literal("")),
    }),
  }),
]);

export const REFERRAL_STATUSES = [
  "SUBMITTED",
  "CONTACTED",
  "ESTIMATE_SENT",
  "BOOKED",
  "JOB_COMPLETED",
  "REWARD_EARNED",
  "REWARD_PAID",
] as const;

export const REFERRAL_STATUS_LABELS: Record<(typeof REFERRAL_STATUSES)[number], string> = {
  SUBMITTED: "Submitted",
  CONTACTED: "Contacted",
  ESTIMATE_SENT: "Estimate Sent",
  BOOKED: "Booked",
  JOB_COMPLETED: "Job Completed",
  REWARD_EARNED: "Reward Earned",
  REWARD_PAID: "Reward Paid",
};

export const REFERRAL_SOURCE_LABELS: Record<string, string> = {
  referral_page: "Personalized Link",
  public_referral_form: "Public Referral Form",
};

export function referralSourceLabel(source: string): string {
  return REFERRAL_SOURCE_LABELS[source] ?? source;
}

export const statusUpdateSchema = z.object({
  status: z.enum(REFERRAL_STATUSES),
  note: z.string().max(1000).optional(),
  actualJobValue: z.coerce.number().nonnegative().optional(),
  estimatedJobValue: z.coerce.number().nonnegative().optional(),
});

export const settingsUpdateSchema = z.object({
  referredDiscountAmount: z.coerce.number().nonnegative().max(100000),
  referrerCreditAmount: z.coerce.number().nonnegative().max(100000),
  referrerGiftCardAmount: z.coerce.number().nonnegative().max(100000),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200);

export const editAdminSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  role: z.enum(["OWNER", "ADMIN"]),
});

export const resetAdminPasswordSchema = z.object({
  newPassword: passwordSchema,
  requireChangeOnNextLogin: z.boolean().optional().default(true),
});

export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});
