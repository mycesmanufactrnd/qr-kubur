import { z } from 'zod';
import { publicProcedure, router } from '../trpc.ts';

export const surahRouter = router({
  getSurah: publicProcedure
    .input(
        z.object({ 
            surahId: z.number(),
            lang: z.string().optional(), 
        })
    )
    .query(async ({ input }) => {
      const { surahId, lang } = input;
      const apiLang = lang === 'ms' ? 'en' : lang || 'en';

      try {
        const res = await fetch(`https://alquran-api.pages.dev/api/quran/surah/${surahId}?lang=${apiLang}`);
        if (!res.ok) throw new Error('Failed to fetch surah');

        const data = await res.json();
        return data;
      } catch (err) {
        console.error('Error fetching surah:', err);
        throw new Error('Surah fetch failed');
      }
    }),
});
