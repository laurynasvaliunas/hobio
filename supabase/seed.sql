-- Hobio local seed data.
-- Loaded by `supabase db reset`. Keep this file safe to re-run.

INSERT INTO public.achievements (slug, title, description, icon, xp_reward, category, threshold)
VALUES
  ('first_session',     'First Session',     'Attend your first session',           'calendar-check', 50,  'attendance', 1),
  ('ten_sessions',      'Regular',           'Attend 10 sessions',                  'trophy',         150, 'attendance', 10),
  ('streak_7',          'Week Streak',       '7 sessions in a row',                 'flame',          100, 'streak',     7),
  ('first_contract',    'First Contract',    'Sign your first contract',            'file-signature', 75,  'contracts',  1),
  ('pays_on_time',      'On Time',           'Pay 3 invoices on time',              'wallet',         100, 'billing',    3),
  ('social_butterfly',  'Social Butterfly',  'Join 3 different groups',             'users',          125, 'groups',     3)
ON CONFLICT (slug) DO NOTHING;
