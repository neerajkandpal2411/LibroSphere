-- Create storage bucket for book covers
INSERT INTO storage.buckets (id, name, public) VALUES ('book-covers', 'book-covers', true);

-- Create storage policies for book covers
CREATE POLICY "Anyone can view book covers" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'book-covers');

CREATE POLICY "Authenticated users can upload book covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'book-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update book covers" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'book-covers' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete book covers" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'book-covers' AND auth.role() = 'authenticated');