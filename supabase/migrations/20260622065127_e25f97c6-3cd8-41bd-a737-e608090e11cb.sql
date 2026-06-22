
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_status TEXT,
  ADD COLUMN IF NOT EXISTS accepts_one_month_deposit BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_guarantor BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS passport_renewal_requested BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS passport_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS staysafe_completed_rentals_count INTEGER DEFAULT 0;
