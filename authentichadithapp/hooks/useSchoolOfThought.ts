import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { supabase } from '@/lib/supabase/client';

export function useSchoolOfThought() {
  const { user } = useAuth();
  const [schoolOfThought, setSchoolOfThought] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSchoolOfThought = async () => {
      if (!user?.id) {
        setSchoolOfThought(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('school_of_thought')
        .eq('user_id', user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        if (__DEV__) console.warn('[profile] school_of_thought unavailable', error);
        setSchoolOfThought(null);
      } else {
        setSchoolOfThought(data?.school_of_thought ?? null);
      }

      setIsLoading(false);
    };

    loadSchoolOfThought();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return { schoolOfThought, isLoading };
}
