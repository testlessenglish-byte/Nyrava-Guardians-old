export type SubscriptionTier = "free" | "starter" | "family" | "premium";

export type Entitlements = {
  maxChildProfiles: number;
  academyAccess: boolean;
  worldAccess: boolean;
  missionAccess: boolean;
  builderAccess: boolean;
  advancedAiAccess: boolean;
  premiumCourses: boolean;
  premiumWorlds: boolean;
  parentReports: boolean;
  familyFeatures: boolean;
};

export const TIER_ENTITLEMENTS: Record<SubscriptionTier, Entitlements> = {
  free: {
    maxChildProfiles: 1,
    academyAccess: true,
    worldAccess: true,
    missionAccess: true,
    builderAccess: false,
    advancedAiAccess: false,
    premiumCourses: false,
    premiumWorlds: false,
    parentReports: true,
    familyFeatures: false,
  },
  starter: {
    maxChildProfiles: 1,
    academyAccess: true,
    worldAccess: true,
    missionAccess: true,
    builderAccess: true,
    advancedAiAccess: false,
    premiumCourses: true,
    premiumWorlds: false,
    parentReports: true,
    familyFeatures: false,
  },
  family: {
    maxChildProfiles: 3,
    academyAccess: true,
    worldAccess: true,
    missionAccess: true,
    builderAccess: true,
    advancedAiAccess: true,
    premiumCourses: true,
    premiumWorlds: true,
    parentReports: true,
    familyFeatures: true,
  },
  premium: {
    maxChildProfiles: 5,
    academyAccess: true,
    worldAccess: true,
    missionAccess: true,
    builderAccess: true,
    advancedAiAccess: true,
    premiumCourses: true,
    premiumWorlds: true,
    parentReports: true,
    familyFeatures: true,
  },
};

export type ParentalControlsData = {
  allowAcademy: boolean;
  allowWorld: boolean;
  allowMissions: boolean;
  allowAiBuilder: boolean;
  allowVoice: boolean;
  allowMicrophone: boolean;
  allowExternalLinks: boolean;
  allowMultiplayer: boolean;
  dailyLimitMinutes: number;
  allowedStart: string | null;
  allowedEnd: string | null;
};

export const DEFAULT_PARENTAL_CONTROLS: ParentalControlsData = {
  allowAcademy: true,
  allowWorld: true,
  allowMissions: true,
  allowAiBuilder: false,
  allowVoice: false,
  allowMicrophone: false,
  allowExternalLinks: false,
  allowMultiplayer: false,
  dailyLimitMinutes: 120,
  allowedStart: "07:00",
  allowedEnd: "21:00",
};

export type SystemSafetyPolicy = {
  systemVoiceSupported: boolean;
  systemAiApproved: boolean;
  systemExternalLinksSafe: boolean;
  systemMultiplayerSafe: boolean;
};

export const SYSTEM_SAFETY_POLICY: SystemSafetyPolicy = {
  systemVoiceSupported: true,
  systemAiApproved: true,
  systemExternalLinksSafe: false,
  systemMultiplayerSafe: false,
};

export type ResolvedChildPolicy = {
  canAccessAcademy: boolean;
  canAccessWorld: boolean;
  canAccessMissions: boolean;
  canAccessBuilder: boolean;
  canUseAI: boolean;
  canUseVoice: boolean;
  canUseMicrophone: boolean;
  canUseSocial: boolean;
  canUseMultiplayer: boolean;
  canOpenExternalLinks: boolean;
  timeAccessAllowed: boolean;
  dailyLimitMinutes: number;
  entitlements: Entitlements;
};

export function resolveChildPolicy({
  tier = "free",
  parentalControls = DEFAULT_PARENTAL_CONTROLS,
  systemPolicy = SYSTEM_SAFETY_POLICY,
  currentMinutesPlayed = 0,
  currentTimeString = "12:00",
}: {
  tier?: SubscriptionTier;
  parentalControls?: Partial<ParentalControlsData>;
  systemPolicy?: SystemSafetyPolicy;
  currentMinutesPlayed?: number;
  currentTimeString?: string;
}): ResolvedChildPolicy {
  const entitlements = TIER_ENTITLEMENTS[tier] ?? TIER_ENTITLEMENTS.free;
  const controls = { ...DEFAULT_PARENTAL_CONTROLS, ...parentalControls };

  // Check quiet hours / time bounds
  let timeAccessAllowed = currentMinutesPlayed < controls.dailyLimitMinutes;
  if (controls.allowedStart && controls.allowedEnd && timeAccessAllowed) {
    if (currentTimeString < controls.allowedStart || currentTimeString > controls.allowedEnd) {
      timeAccessAllowed = false;
    }
  }

  // Mandatory Hierarchy: System Safety Policy > Parental Restriction > Subscription Entitlement
  return {
    canAccessAcademy: controls.allowAcademy && entitlements.academyAccess,
    canAccessWorld: controls.allowWorld && entitlements.worldAccess,
    canAccessMissions: controls.allowMissions && entitlements.missionAccess,
    canAccessBuilder: controls.allowAiBuilder && entitlements.builderAccess,
    canUseAI:
      systemPolicy.systemAiApproved && controls.allowAiBuilder && entitlements.builderAccess,
    canUseVoice: systemPolicy.systemVoiceSupported && controls.allowVoice,
    canUseMicrophone:
      systemPolicy.systemVoiceSupported && controls.allowVoice && controls.allowMicrophone,
    canUseSocial: systemPolicy.systemMultiplayerSafe && controls.allowMultiplayer,
    canUseMultiplayer: systemPolicy.systemMultiplayerSafe && controls.allowMultiplayer,
    canOpenExternalLinks: systemPolicy.systemExternalLinksSafe && controls.allowExternalLinks,
    timeAccessAllowed,
    dailyLimitMinutes: controls.dailyLimitMinutes,
    entitlements,
  };
}
