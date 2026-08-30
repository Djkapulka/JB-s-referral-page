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

export const statusUpdateSchema = z.object({
  status: z.enum([
    "SUBMITTED",
    "CONTACTED",
    "ESTIMATE_SENT",
    "BOOKED",
    "JOB_COMPLETED",
    "REWARD_EARNED",
    "REWARD_PAID",
  ]),
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
