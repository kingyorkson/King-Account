import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fqmmzwtlnnsisgdawwho.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxbW16d3Rsbm5zaXNnZGF3d2hvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMzI3MTgsImV4cCI6MjA5ODkwODcxOH0.2uJCAKovzpYI2J9SQRiD7hq53-O0KE47gzQgq1tA3-8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
