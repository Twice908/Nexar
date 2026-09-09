export type CommuteProfile = {
  name: string;
  profileImageUrl: string | null;
  gender: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';
  homeZoneLabel: string;
  homeZoneLatitude: number;
  homeZoneLongitude: number;
  officeBuilding: string;
  officeEntryWindow: string;
  commuteDays: string[];
  vehicleModel: string;
  vehiclePlateNumber: string;
  vehicleSeatsAvailable: number;
  rolePreference: 'driver' | 'passenger' | 'both';
};

export type VerificationStatus = {
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  workEmailVerified: boolean;
  isVerified: boolean;
};

export type OnboardingResponse = {
  complete: boolean;
  profile: CommuteProfile | null;
  verification: VerificationStatus;
};

export const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export const weekdayLabels: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
};

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || name;
}

export function maskedPlate(plate: string) {
  const trimmed = plate.trim();
  if (trimmed.length <= 4) {
    return trimmed;
  }
  return `•••• ${trimmed.slice(-4)}`;
}

export function formatCommuteDays(days: string[]) {
  return days.map((day) => weekdayLabels[day] ?? day).join(' · ');
}

export async function fetchOnboarding(
  token: string | null,
): Promise<OnboardingResponse> {
  const response = await fetch(`${apiBaseUrl}/v1/onboarding`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (response.status === 401) {
    return {
      complete: false,
      profile: null,
      verification: {
        email: null,
        phone: null,
        emailVerified: false,
        phoneVerified: false,
        workEmailVerified: false,
        isVerified: false,
      },
    };
  }

  if (!response.ok) {
    throw new Error('Unable to load your commute profile.');
  }

  return (await response.json()) as OnboardingResponse;
}
