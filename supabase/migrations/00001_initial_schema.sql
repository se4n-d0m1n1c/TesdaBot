-- 1. Create Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  ncii_track TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Trigger to create profile automatically? We can handle this in the client side on sign up, or via trigger.
-- For simplicity, we'll let the client handle profile creation or do it via trigger.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, ncii_track)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'ncii_track'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Create Questions Table
CREATE TABLE IF NOT EXISTS public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ncii_track TEXT NOT NULL,
  module TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_index INTEGER NOT NULL,
  hint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by track
CREATE INDEX IF NOT EXISTS idx_questions_ncii_track ON public.questions(ncii_track);

-- RLS for Questions (Publicly readable)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Questions are publicly readable" ON public.questions
  FOR SELECT USING (true);

-- 3. Create Assessment Records Table
CREATE TABLE IF NOT EXISTS public.assessment_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ncii_track TEXT NOT NULL,
  module TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for assessment queries
CREATE INDEX IF NOT EXISTS idx_assessment_records_user_id ON public.assessment_records(user_id);

-- RLS for Assessment Records
ALTER TABLE public.assessment_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own records" ON public.assessment_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own records" ON public.assessment_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Create Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  messages JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for chat sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);

-- RLS for Chat Sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own chat sessions" ON public.chat_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat sessions" ON public.chat_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Seed Initial Practice Questions for CSS NCII
INSERT INTO public.questions (ncii_track, module, question_text, options, correct_option_index, hint)
VALUES 
(
  'Computer Systems Servicing NCII',
  'Networking Concepts',
  'What is the standard IPv4 loopback address?',
  '["192.168.1.1", "127.0.0.1", "10.0.0.1", "255.255.255.0"]'::jsonb,
  1,
  'Think about the IP address used to test the local network interface without sending data to the actual network. It usually starts with 127.'
),
(
  'Computer Systems Servicing NCII',
  'Networking Concepts',
  'Which of the following is used to crimp an RJ45 connector to a UTP cable?',
  '["Wire Stripper", "Punch Down Tool", "Crimping Tool", "Multimeter"]'::jsonb,
  2,
  'The name of the tool is directly related to the action of "crimping".'
),
(
  'Computer Systems Servicing NCII',
  'Server Configuration',
  'Which protocol is responsible for automatically assigning IP addresses to devices on a network?',
  '["DNS", "DHCP", "FTP", "HTTP"]'::jsonb,
  1,
  'It stands for Dynamic Host Configuration Protocol.'
),
(
  'Computer Systems Servicing NCII',
  'Safety Procedures',
  'Before opening a computer case to replace components, what is the most important safety step?',
  '["Put on safety goggles", "Disconnect the power cable", "Touch the motherboard", "Use a magnetic screwdriver"]'::jsonb,
  1,
  'Always remove the source of electricity to prevent electric shock and component damage.'
)
ON CONFLICT DO NOTHING;
