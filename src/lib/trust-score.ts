// StaySafe Trust Score engine — implements the V3 configuration matrix.
// Pure functions; no side effects. Used both by the live preview meter on
// the passport application form and by the admin verification panel.

export type TrustInput = {
  // 1.0 Identity
  is_identity_verified?: boolean | null;

  // 2.1 Income & student status
  monthly_income_net?: number | null;
  is_student?: boolean | null;
  student_status?: string | null; // 'working' | 'non_working_supported'

  // 2.2 / 2.3 financial declarations
  accepts_one_month_deposit?: boolean | null;
  has_guarantor?: boolean | null;

  // 3.2 / 3.3 / 3.4 social
  social_facebook_url?: string | null;
  instagram_username?: string | null;
  linkedin_url?: string | null;

  // 4.x lease history
  lease_history?: Array<{
    references_available?: boolean | null;
    contract_url?: string | null;
  }> | null;

  // 5.x StaySafe ecosystem history
  staysafe_completed_rentals_count?: number | null;
};

export type TrustBreakdown = {
  identity: number; // 0 or 20
  income: number;   // 0 / 12.5 / 18.75 / 25
  deposit: number;  // 0 or 6
  guarantor: number; // 0 or 10
  financeTotal: number; // capped 41
  student: number; // 0 or 7
  facebook: number; // 0 or 2
  instagram: number; // 0 or 2
  linkedin: number; // 0 or 3
  socialTotal: number; // capped 14
  history: number; // capped 10
  staysafe: number; // capped 15
  rawTotal: number;
  cappedTotal: number; // global cap (85 without StaySafe rental, else 100)
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

export function computeTrustScore(d: TrustInput): TrustBreakdown {
  // 1.1
  const identity = d.is_identity_verified ? 20 : 0;

  // 2.1 — income (with student override)
  let income = 0;
  if (d.is_student && d.student_status === "non_working_supported") {
    income = 18.75;
  } else {
    const m = Number(d.monthly_income_net ?? 0);
    if (m >= 5001) income = 25;
    else if (m >= 3001) income = 18.75;
    else if (m >= 2000) income = 12.5;
    else income = 0;
  }

  // 2.2 / 2.3
  const deposit = d.accepts_one_month_deposit ? 6 : 0;
  const guarantor = d.has_guarantor ? 10 : 0;
  const financeTotal = Math.min(41, income + deposit + guarantor);

  // 3.1
  const student = d.is_student ? 7 : 0;
  // 3.2 / 3.3 / 3.4
  const facebook = isFb(d.social_facebook_url) ? 2 : 0;
  const instagram = d.instagram_username && d.instagram_username.trim().length > 0 ? 2 : 0;
  const linkedin = isLi(d.linkedin_url) ? 3 : 0;
  const socialTotal = Math.min(14, student + facebook + instagram + linkedin);

  // 4.x — lease history (max 3 entries)
  const entries = (d.lease_history ?? []).slice(0, 3);
  let history = 0;
  entries.forEach((e, i) => {
    const base = i === 0 ? 3 : 0.5;
    const ref = e.references_available ? 1 : 0;
    const scan = e.contract_url ? 1 : 0;
    history += base + ref + scan;
  });
  history = Math.min(10, history);

  // 5.x — StaySafe completed rentals
  const completed = Math.max(0, Number(d.staysafe_completed_rentals_count ?? 0));
  let staysafe = 0;
  if (completed >= 1) staysafe += 9;
  if (completed >= 2) staysafe += 6;
  staysafe = Math.min(15, staysafe);

  const rawTotal = identity + financeTotal + socialTotal + history + staysafe;

  // Global cap: without at least one completed StaySafe rental, max = 85
  const hasStaysafeRental = completed >= 1;
  const cappedTotal = hasStaysafeRental ? Math.min(100, rawTotal) : Math.min(85, rawTotal);

  return {
    identity, income, deposit, guarantor, financeTotal,
    student, facebook, instagram, linkedin, socialTotal,
    history, staysafe,
    rawTotal,
    cappedTotal: Math.round(cappedTotal * 100) / 100,
    hasStaysafeRental,
  };
}
