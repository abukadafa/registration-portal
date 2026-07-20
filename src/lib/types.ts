export type ParticipantCategory =
  | "Researcher"
  | "Policy Maker"
  | "Industry / Private Sector"
  | "Farmer"
  | "Student"
  | "Development Partner"
  | "Speaker"
  | "Sponsor"
  | "Media"
  | "Other";

export type PaymentStatus = "Pending" | "Paid" | "Waived";
export type RegistrationStatus = "Pending Approval" | "Approved" | "Rejected";

export interface Participant {
  id: string;
  badgeNumber: string;
  title: string;
  firstName: string;
  lastName: string;
  gender: "Male" | "Female" | "Prefer not to say";
  country: string;
  state?: string;
  organization: string;
  department?: string;
  position?: string;
  email: string;
  phone: string;
  category: ParticipantCategory;
  photoUrl?: string;
  dietaryPreference?: string;
  accommodationNeeded: boolean;
  abstractSubmitted: boolean;
  paymentStatus: PaymentStatus;
  registrationStatus: RegistrationStatus;
  createdAt: string;
}

export type NewParticipantInput = Omit<
  Participant,
  "id" | "badgeNumber" | "registrationStatus" | "createdAt" | "photoUrl"
>;
