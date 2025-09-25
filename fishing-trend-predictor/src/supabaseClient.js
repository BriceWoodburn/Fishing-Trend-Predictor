import { createClient } from '@supabase/supabase-js';

// Replace these with your Supabase project info
const supabaseUrl = "https://fczfpqfwcxfhyakgggbf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjemZwcWZ3Y3hmaHlha2dnZ2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDExNjgsImV4cCI6MjA3NDMxNzE2OH0.3GXsvqAVIWgLpMaItTKMvgxL7i9uqO4Y4SV9i8fCwiw"; // Use anon key for frontend
export const supabase = createClient(supabaseUrl, supabaseKey);
