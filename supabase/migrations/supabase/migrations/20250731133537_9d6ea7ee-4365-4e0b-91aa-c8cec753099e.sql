-- Create enum types for better data integrity
CREATE TYPE public.book_status AS ENUM ('available', 'checked_out', 'reserved', 'maintenance', 'lost');
CREATE TYPE public.member_status AS ENUM ('active', 'suspended', 'expired');
CREATE TYPE public.transaction_type AS ENUM ('checkout', 'return', 'renewal', 'reservation');
CREATE TYPE public.user_role AS ENUM ('admin', 'librarian', 'member');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'member',
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create authors table
CREATE TABLE public.authors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  birth_date DATE,
  nationality TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  isbn TEXT UNIQUE,
  author_id UUID REFERENCES public.authors(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  publisher TEXT,
  publication_year INTEGER,
  pages INTEGER,
  language TEXT DEFAULT 'English',
  description TEXT,
  cover_image_url TEXT,
  location TEXT, -- shelf location
  total_copies INTEGER NOT NULL DEFAULT 1,
  available_copies INTEGER NOT NULL DEFAULT 1,
  status book_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create members table (extends profiles for library-specific info)
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  membership_number TEXT NOT NULL UNIQUE,
  membership_type TEXT DEFAULT 'standard',
  status member_status NOT NULL DEFAULT 'active',
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  max_books_allowed INTEGER NOT NULL DEFAULT 5,
  current_books_issued INTEGER NOT NULL DEFAULT 0,
  fine_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  librarian_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  transaction_type transaction_type NOT NULL,
  checkout_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  return_date TIMESTAMP WITH TIME ZONE,
  fine_amount DECIMAL(10,2) DEFAULT 0.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  reservation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fines table
CREATE TABLE public.fines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, waived
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for categories (public read, admin write)
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'librarian'));

-- RLS Policies for authors (public read, admin write)
CREATE POLICY "Anyone can view authors" ON public.authors FOR SELECT USING (true);
CREATE POLICY "Admins can manage authors" ON public.authors FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'librarian'));

-- RLS Policies for books (public read, admin write)
CREATE POLICY "Anyone can view books" ON public.books FOR SELECT USING (true);
CREATE POLICY "Admins can manage books" ON public.books FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'librarian'));

-- RLS Policies for members
CREATE POLICY "Users can view all members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Admins can manage members" ON public.members FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'librarian'));

-- RLS Policies for transactions
CREATE POLICY "Users can view all transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Admins can manage transactions" ON public.transactions FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'librarian'));

-- RLS Policies for reservations
CREATE POLICY "Users can view their reservations" ON public.reservations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.members m 
    JOIN public.profiles p ON m.profile_id = p.id 
    WHERE m.id = member_id AND p.user_id = auth.uid()
  ) OR public.get_user_role(auth.uid()) IN ('admin', 'librarian')
);
CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.members m 
    JOIN public.profiles p ON m.profile_id = p.id 
    WHERE m.id = member_id AND p.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can manage reservations" ON public.reservations FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'librarian'));

-- RLS Policies for fines
CREATE POLICY "Users can view their fines" ON public.fines FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.members m 
    JOIN public.profiles p ON m.profile_id = p.id 
    WHERE m.id = member_id AND p.user_id = auth.uid()
  ) OR public.get_user_role(auth.uid()) IN ('admin', 'librarian')
);
CREATE POLICY "Admins can manage fines" ON public.fines FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'librarian'));

-- Create function to automatically create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'member'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update book availability
CREATE OR REPLACE FUNCTION public.update_book_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.transaction_type = 'checkout' THEN
      UPDATE public.books 
      SET available_copies = available_copies - 1,
          status = CASE WHEN available_copies - 1 = 0 THEN 'checked_out' ELSE status END
      WHERE id = NEW.book_id;
      
      UPDATE public.members 
      SET current_books_issued = current_books_issued + 1
      WHERE id = NEW.member_id;
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.transaction_type = 'checkout' AND NEW.return_date IS NOT NULL AND OLD.return_date IS NULL THEN
      UPDATE public.books 
      SET available_copies = available_copies + 1,
          status = CASE WHEN available_copies + 1 > 0 THEN 'available' ELSE status END
      WHERE id = NEW.book_id;
      
      UPDATE public.members 
      SET current_books_issued = current_books_issued - 1
      WHERE id = NEW.member_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update book availability
CREATE TRIGGER update_book_availability_trigger
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_book_availability();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON public.books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.categories (name, description) VALUES
('Fiction', 'Fictional literature and novels'),
('Non-Fiction', 'Educational and factual books'),
('Science', 'Scientific texts and research'),
('Technology', 'Computer science and technology books'),
('History', 'Historical texts and biographies'),
('Art', 'Art, design, and creative books');

INSERT INTO public.authors (name, bio, nationality) VALUES
('George Orwell', 'English novelist and essayist', 'British'),
('J.K. Rowling', 'British author, best known for Harry Potter series', 'British'),
('Stephen King', 'American author of horror, supernatural fiction', 'American'),
('Agatha Christie', 'English writer known for detective novels', 'British'),
('Isaac Asimov', 'American writer and professor of biochemistry', 'American');

-- Enable realtime for all tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.books REPLICA IDENTITY FULL;
ALTER TABLE public.members REPLICA IDENTITY FULL;
ALTER TABLE public.transactions REPLICA IDENTITY FULL;
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.fines REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.books;
ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fines;