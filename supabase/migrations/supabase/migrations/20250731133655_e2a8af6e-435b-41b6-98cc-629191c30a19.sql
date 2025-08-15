-- Fix security warning by setting search_path for functions

-- Update get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Update update_book_availability function
CREATE OR REPLACE FUNCTION public.update_book_availability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;