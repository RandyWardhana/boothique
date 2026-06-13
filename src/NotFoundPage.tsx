import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { useDismissBoot } from '@/hooks/useDismissBoot';
import { useStandaloneTheme } from '@/hooks/useStandaloneTheme';

/** Branded 404 shown for any route that isn't the booth, a share or the admin
 *  console — keeps unknown URLs on-theme instead of dropping into the booth. */
export function NotFoundPage() {
  useDismissBoot();
  useStandaloneTheme();

  return (
    <div className="min-h-screen bg-base text-ink font-sans flex flex-col items-center justify-center gap-6 px-5 py-16">
      {/* Brand header — matches the share page */}
      <div className="flex flex-col items-center gap-1">
        <span className="font-heading text-5xl text-ink leading-none">Boothique</span>
        <svg viewBox="0 0 200 16" width="200" height="16" aria-hidden="true">
          <path d="M4 12 Q100 2 196 11" stroke="var(--accent)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      <div className="w-full max-w-sm bg-surface border border-line rounded-[calc(var(--radius)*1.5)] p-8 flex flex-col items-center gap-3 shadow-lg">
        <span className="bg-frame text-ink rounded-full px-4 py-1.5 text-[13px] font-bold">404</span>
        <p className="text-ink text-lg font-bold m-0 text-center">Page not found</p>
        <p className="text-sub text-sm text-center m-0 leading-relaxed">
          This page doesn&rsquo;t exist or has moved. Let&rsquo;s get you back to the booth.
        </p>
        <a
          href="/"
          className="mt-2 w-full inline-flex items-center justify-center gap-2 font-sans font-bold text-[15px] bg-accent text-on-accent rounded-app px-5 py-3 cursor-pointer border-0 no-underline"
        >
          ← Back to Boothique
        </a>
      </div>

      <p className="text-xs text-sub text-center max-w-xs leading-relaxed m-0 opacity-70">
        Made with Boothique — a photo booth in your browser.
      </p>

      <SpeedInsights />
      <Analytics />
    </div>
  );
}
