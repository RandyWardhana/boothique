import { useState } from 'react';
import type { Translate } from '@/i18n';
import { shareUrl } from '@/lib/download';
import type { useShareLink } from '@/hooks/useShareLink';
import { Button, Card } from '@/components/ui';

interface SharePanelProps {
  t: Translate;
  brand: string;
  share: ReturnType<typeof useShareLink>;
}

/** The 72-hour share-link panel: progress, the link, copy and native share. */
export function SharePanel({ t, brand, share }: SharePanelProps) {
  const [copied, setCopied] = useState(false);

  if (share.status === 'idle') return null;

  const copy = async () => {
    if (!share.link) return;
    try {
      await navigator.clipboard.writeText(share.link.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the link is still selectable in the field */
    }
  };

  const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <Card className="w-[min(440px,100%)] flex flex-col gap-3 items-stretch">
      {share.busy ? (
        <p className="m-0 text-center font-sans text-sm text-sub">
          {share.status === 'rendering' ? t('shareRendering') : t('shareUploading')}
        </p>
      ) : null}

      {share.status === 'error' ? (
        <>
          <p className="m-0 text-center font-sans text-sm text-sub">{t('shareLinkError')}</p>
          <Button variant="outline" onClick={() => void share.create()}>
            {t('shareRetry')}
          </Button>
        </>
      ) : null}

      {share.status === 'ready' && share.link ? (
        <>
          <span className="self-center bg-frame text-on-accent rounded-full px-3.5 py-1.5 font-sans text-[13px] font-bold">
            {t('shareLinkReady')}
          </span>

          <input
            readOnly
            value={share.link.url}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full px-3 py-2.5 rounded-app border border-line bg-base text-center text-ink font-mono text-[13px]"
          />

          <div className="flex gap-2.5">
            <Button full onClick={() => void copy()}>
              {copied ? t('shareCopied') : t('shareCopy')}
            </Button>
            {canNativeShare ? (
              <Button full variant="accent2" onClick={() => void shareUrl(share.link!.url, brand)}>
                {t('share')}
              </Button>
            ) : null}
          </div>

          <p className="m-0 text-center font-sans text-[12.5px] text-sub leading-relaxed">{t('shareLinkNote')}</p>
        </>
      ) : null}
    </Card>
  );
}
