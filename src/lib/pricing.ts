export type PromoPlan = { days: number; price: number; label: string };

export const PROMO_PLANS: PromoPlan[] = [
  { days: 7, price: 9, label: "7 dni" },
  { days: 14, price: 19, label: "14 dni" },
  { days: 30, price: 29, label: "30 dni" },
];

export const PASSPORT_RENEWAL_PRICE = 29;
export const SMS_PRICE = 9.99;
