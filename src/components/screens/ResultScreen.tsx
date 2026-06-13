import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Filter, FrameOptions, Lang, LayoutId, Shot, Sticker } from '@/types';
import type { Translate } from '@/i18n';
import { LAYOUTS } from '@/lib/frames/layouts';
import { getSkin } from '@/lib/frames/skins';
import { renderVideo } from '@/lib/frames/compose';
import { buildFrameInfo } from '@/lib/frames/info';
import { downloadCanvas, shareFiles } from '@/lib/download';
import { isShareLinkEnabled } from '@/lib/shareLink';
import { useBeautifiedShots } from '@/hooks/useBeautifiedShots';
import { useStillImage } from '@/hooks/useStillImage';
import { useVideoExport } from '@/hooks/useVideoExport';
import { useShareLink } from '@/hooks/useShareLink';
import { beautySignature, fileBaseName, orderShots } from '@/utils/shots';
import { previewWidth } from '@/utils/preview';
import { BottomBar, Button, Card, ConfirmDialog } from '@/components/ui';
import { FramePreview } from '@/components/FramePreview';
import { SharePanel } from '@/components/SharePanel';

interface ResultScreenProps {
  t: Translate;
  lang: Lang;
  brand: string;
  shots: Shot[];
  selected: string[];
  layoutId: LayoutId;
  skinId: string;
  filter: Filter;
  dateStamp: boolean;
  igHandle: string;
  stickers: Sticker[];
  onBack: () => void;
  onRestart: () => void;
}

const CARD_LABEL = 'font-sans text-[13px] font-bold text-sub uppercase tracking-wide';

export function ResultScreen({ t, lang, brand, shots, selected, layoutId, skinId, filter, dateStamp, igHandle, stickers, onBack, onRestart }: ResultScreenProps) {
  const layout = LAYOUTS[layoutId];
  const skin = getSkin(skinId);
  const ordered = orderShots(shots, selected);
  const beautified = useBeautifiedShots(ordered, filter.beautify);
  const info = useMemo(() => buildFrameInfo(brand, lang, igHandle), [brand, lang, igHandle]);

  const opts = useMemo<FrameOptions>(
    () => ({ layout, skin, shots: beautified, filter, beautify: filter.beautify, dateStamp, stickers, info }),
    [layout, skin, beautified, filter, dateStamp, stickers, info],
  );
  const fileBase = fileBaseName(brand);

  const { url: stillUrl, canvasRef } = useStillImage(opts, beautySignature(beautified));
  const { progress, exportVideo } = useVideoExport({ opts, fileBase });

  const previewW = previewWidth(layout, 300);
  const hasClips = ordered.some((s) => s?.clipUrl);
  const linkEnabled = isShareLinkEnabled();

  const buildPhoto = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const canvas = canvasRef.current;
        if (!canvas) resolve(null);
        else canvas.toBlob(resolve, 'image/png');
      }),
    [canvasRef],
  );
  const buildVideo = useCallback(
    () => (hasClips ? renderVideo(opts).then((result) => result.blob) : Promise.resolve<Blob | null>(null)),
    [hasClips, opts],
  );
  // Starts backing the result up to R2 as soon as the still is rendered — the
  // share button then reuses that upload instead of starting a new one.
  const shareLink = useShareLink({ brand, buildPhoto, buildVideo, hasVideo: hasClips, resultReady: Boolean(stillUrl) });

  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const shareMsgTimer = useRef<ReturnType<typeof window.setTimeout> | null>(null);

  useEffect(() => () => { if (shareMsgTimer.current != null) window.clearTimeout(shareMsgTimer.current); }, []);

  const downloadPhoto = () => {
    if (canvasRef.current) downloadCanvas(canvasRef.current, `${fileBase}.png`);
  };

  // Native file share — used only when no share Worker is configured.
  const nativeShare = async () => {
    let result: Awaited<ReturnType<typeof shareFiles>> = 'unsupported';
    const blob = await buildPhoto();
    if (blob) result = await shareFiles([new File([blob], `${fileBase}.png`, { type: 'image/png' })], brand);
    if (result === 'unsupported') setShareMsg(t('shareNone'));
    else if (result === 'shared') setShareMsg(t('shareDone'));
    if (result !== 'aborted') {
      if (shareMsgTimer.current != null) window.clearTimeout(shareMsgTimer.current);
      shareMsgTimer.current = window.setTimeout(() => setShareMsg(null), 2500);
    }
  };

  return (
    <div data-screen-label="Result" className="min-h-full flex flex-col">
      <div className="flex-1 flex flex-col items-center gap-4 px-3 sm:px-4 py-4">
        <h2 className="font-heading text-[clamp(24px,6vw,34px)] text-ink m-0 text-center">{t('resultTitle')}</h2>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-start w-full max-w-2xl">
          <Card className="p-3 sm:p-[18px] flex flex-col gap-3 items-center flex-1">
            <span className={CARD_LABEL}>{t('photoCard')}</span>
            {stillUrl ? (
              <img
                src={stillUrl}
                alt={t('photoCard')}
                className="block rounded shadow-[0_8px_32px_rgba(0,0,0,0.28)]"
                style={{ width: previewW }}
              />
            ) : (
              <div
                className="flex items-center justify-center text-sub font-sans"
                style={{ width: previewW, height: Math.round((previewW * layout.h) / layout.w) }}
              >
                …
              </div>
            )}
            <Button full onClick={downloadPhoto} disabled={!stillUrl}>
              ↓ {t('downloadPhoto')} (PNG)
            </Button>
          </Card>

          <Card className="p-3 sm:p-[18px] flex flex-col gap-3 items-center flex-1">
            <span className={CARD_LABEL}>{t('videoCard')}</span>
            <FramePreview
              layout={layout}
              skin={skin}
              shots={beautified}
              filter={filter}
              beautify={filter.beautify}
              dateStamp={dateStamp}
              stickers={stickers}
              info={info}
              width={previewW}
              animated={hasClips}
            />
            <Button full variant="accent2" onClick={() => void exportVideo()} disabled={!hasClips || progress != null}>
              {progress != null ? t('rendering', { p: Math.round(progress * 100) }) : `↓ ${t('downloadVideo')} (MP4)`}
            </Button>
            {progress != null ? (
              <div className="w-full h-1.5 rounded-[3px] bg-line overflow-hidden">
                <div className="h-full bg-accent2 transition-[width] duration-200" style={{ width: `${progress * 100}%` }} />
              </div>
            ) : (
              <span className="font-sans text-xs text-sub">{t('videoNote')}</span>
            )}
          </Card>
        </div>

        {linkEnabled ? <SharePanel t={t} brand={brand} share={shareLink} /> : null}
        {!linkEnabled && shareMsg ? <div className="font-sans text-[13.5px] text-sub">{shareMsg}</div> : null}

        <Button variant="ghost" onClick={() => setConfirmOpen(true)}>
          {t('startOver')}
        </Button>

        <ConfirmDialog
          open={confirmOpen}
          title={t('startOver')}
          message={t('confirmRestart')}
          confirmLabel={t('startOver')}
          cancelLabel={t('cancel')}
          onConfirm={() => { setConfirmOpen(false); onRestart(); }}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>

      <BottomBar>
        <Button variant="outline" onClick={onBack} className="shrink-0 min-h-14 px-5" aria-label={t('back')}>
          ←<span className="hidden xs:inline">&nbsp;{t('back')}</span>
        </Button>
        {linkEnabled ? (
          <Button variant="accent2" big full className="flex-1" onClick={() => void shareLink.create()} disabled={shareLink.busy || !stillUrl}>
            {shareLink.busy ? t('shareUploading') : t('shareLink')}
          </Button>
        ) : (
          <Button variant="accent2" big full className="flex-1" onClick={() => void nativeShare()}>
            {t('share')}
          </Button>
        )}
      </BottomBar>
    </div>
  );
}
