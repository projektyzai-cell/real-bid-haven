// StaySafe Trust Score engine — implements the V3 configuration matrix.
// Pure functions; no side effects. Used both by the live preview meter on
// the passport application form and by the admin verification panel.

export type TrustWeights = {
  identity: number;
  income_low: number;
  income_mid: number;
  income_high: number;
  deposit: number;
  guarantor: number;
  occasional_lease: number;
  tenant_insurance: number;
  student: number;
  facebook: number;
  instagram: number;
  linkedin: number;
  external_history_first: number;
  external_history_next: number;
  external_history_reference: number;
  external_history_scan: number;
  staysafe_first_rental: number;
  staysafe_second_rental: number;
  finance_cap: number;
  social_cap: number;
  history_cap: number;
  staysafe_cap: number;
  global_cap: number;
  cap_no_staysafe: number;
};

export const DEFAULT_TRUST_WEIGHTS: TrustWeights = {
  identity: 20,
  income_low: 12.5,
  income_mid: 18.75,
  income_high: 25,
  deposit: 6,
  guarantor: 10,
  occasional_lease: 4,
  tenant_insurance: 3,
  student: 7,
  facebook: 2,
  instagram: 2,
  linkedin: 3,
  external_history_first: 3,
  external_history_next: 0.5,
  external_history_reference: 1,
  external_history_scan: 1,
  staysafe_first_rental: 9,
  staysafe_second_rental: 6,
  finance_cap: 41,
  social_cap: 14,
  history_cap: 10,
  staysafe_cap: 15,
  global_cap: 100,
  cap_no_staysafe: 85,
};

export type TrustInput = {
  // 1.0 Identity
  is_identity_verified?: boolean | null;

  // 2.1 Income & student status
  monthly_income_net?: number | null;
  is_student?: boolean | null;
  student_status?: string | null;

  // 2.2 / 2.3 financial declarations
  accepts_one_month_deposit?: boolean | null;
  has_guarantor?: boolean | null;

  // 2.4 / 2.5 lease-type declarations
  accepts_occasional_lease?: boolean | null;
  has_tenant_insurance?: boolean | null;

  // 3.x social (each with its own admin-approval gate)
  social_facebook_url?: string | null;
  social_facebook_verified?: boolean | null;
  instagram_username?: string | null;
  social_instagram_verified?: boolean | null;
  linkedin_url?: string | null;
  social_linkedin_verified?: boolean | null;

  // 4.x external lease history
  lease_history?: Array<{
    references_available?: boolean | null;
    contract_url?: string | null;
  }> | null;

  // 5.x StaySafe ecosystem history
  staysafe_completed_rentals_count?: number | null;
};

export type TrustBreakdown = {
  identity: number;
  income: number;
  deposit: number;
  guarantor: number;
  occasionalLease: number;
  tenantInsurance: number;
  financeTotal: number;
  student: number;
  facebook: number;
  instagram: number;
  linkedin: number;
  socialTotal: number;
  history: number;
  staysafe: number;
  rawTotal: number;
  cappedTotal: number;
  hasStaysafeRental: boolean;
};

function isFb(u?: string | null) {
  if (!u) return false;
  try {
    const h = new URL(u).hostname;
    return /(^|\.)(facebook\.com|fb\.com)$/i.test(h);
  } catch { return false; }
}
function isLi(u?: string | null) {
  if (!u) return false;
  try {
    const h = new URL(u).hostname;
    return /(^|\.)linkedin\.com$/i.test(h);
  } catch { return false; }
}

export function computeTrustScore(
  d: TrustInput,
  weights: TrustWeights = DEFAULT_TRUST_WEIGHTS,
): TrustBreakdown {
  const w = weights;
  const identity = d.is_identity_verified ? w.identity : 0;

  let income = 0;
  if (d.is_student && d.student_status === "non_working_supported") {
    income = w.income_mid;
  } else {
    const m = Number(d.monthly_income_net ?? 0);
    if (m >= 5001) income = w.income_high;
    else if (m >= 3001) income = w.income_mid;
    else if (m >= 2000) income = w.income_low;
    else income = 0;
  }

  const deposit = d.accepts_one_month_deposit ? w.deposit : 0;
  const guarantor = d.has_guarantor ? w.guarantor : 0;
  const occasionalLease = d.accepts_occasional_lease ? w.occasional_lease : 0;
  const tenantInsurance = d.has_tenant_insurance ? w.tenant_insurance : 0;
  const financeTotal = Math.min(
    w.finance_cap,
    income + deposit + guarantor + occasionalLease + tenantInsurance,
  );

  const student = d.is_student ? w.student : 0;
  const facebook = isFb(d.social_facebook_url) && d.social_facebook_verified ? w.facebook : 0;
  const instagram =
    d.instagram_username && d.instagram_username.trim().length > 0 && d.social_instagram_verified
      ? w.instagram
      : 0;
  const linkedin = isLi(d.linkedin_url) && d.social_linkedin_verified ? w.linkedin : 0;
  const socialTotal = Math.min(w.social_cap, student + facebook + instagram + linkedin);

  const entries = (d.lease_history ?? []).slice(0, 3);
  let history = 0;
  entries.forEach((e, i) => {
    const base = i === 0 ? w.external_history_first : w.external_history_next;
    const ref = e.references_available ? w.external_history_reference : 0;
    const scan = e.contract_url ? w.external_history_scan : 0;
    history += base + ref + scan;
  });
  history = Math.min(w.history_cap, history);

  const completed = Math.max(0, Number(d.staysafe_completed_rentals_count ?? 0));
  let staysafe = 0;
  if (completed >= 1) staysafe += w.staysafe_first_rental;
  if (completed >= 2) staysafe += w.staysafe_second_rental;
  staysafe = Math.min(w.staysafe_cap, staysafe);

  const rawTotal = identity + financeTotal + socialTotal + history + staysafe;
  const hasStaysafeRental = completed >= 1;
  const cappedTotal = hasStaysafeRental
    ? Math.min(w.global_cap, rawTotal)
    : Math.min(w.cap_no_staysafe, rawTotal);

  return {
    identity,
    income,
    deposit,
    guarantor,
    occasionalLease,
    tenantInsurance,
    financeTotal,
    student,
    facebook,
    instagram,
    linkedin,
    socialTotal,
    history,
    staysafe,
    rawTotal,
    cappedTotal: Math.round(cappedTotal * 100) / 100,
    hasStaysafeRental,
  };
}
