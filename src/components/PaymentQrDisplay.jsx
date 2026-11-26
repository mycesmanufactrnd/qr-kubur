import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Share2, Landmark, QrCode } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { apiUrl } from '@/utils';
import { translate } from '@/utils/translations';

const OPEN_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const CLOSE_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
const CENTERED = 'translate(-50%, -50%)'; // DialogContent's resting transform
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Transform that lays the modal's QR box exactly over `origin` (the tapped thumbnail), so the
// QR looks like it grows out of the thumbnail and shrinks back into it. No origin → gentle zoom.
function fromOrigin(content, qrBox, origin) {
  const q = qrBox?.getBoundingClientRect();
  const o = origin?.getBoundingClientRect();
  if (!q?.width || !o?.width) return `${CENTERED} scale(0.9)`;
  const c = content.getBoundingClientRect();
  const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
  const s = o.width / q.width;
  const dx = o.left + o.width / 2 - cx - s * (q.left + q.width / 2 - cx);
  const dy = o.top + o.height / 2 - cy - s * (q.top + q.height / 2 - cy);
  return `${CENTERED} translate(${dx}px, ${dy}px) scale(${s})`;
}

export function PaymentQrModal({ open, onOpenChange, name, src, location, recipientLabel, asset, originRef }) {
  const contentRef = useRef(null);
  const overlayRef = useRef(null);
  const qrBoxRef = useRef(null);
  const closing = useRef(false);
  const animated = useRef(false);
  useEffect(() => { if (!open) { animated.current = false; closing.current = false; } }, [open]);

  // Runs when the dialog content mounts. CSS enter/exit animations are switched off (inline
  // `animation: none`) and replaced by these Web Animations, which can start from the thumbnail.
  // Radix re-attaches this ref several times while opening; animate only on the first attach,
  // otherwise a re-measure mid-animation produces an identity start frame (a full-size flash).
  const animateIn = useCallback((node) => {
    if (node) contentRef.current = node;
    if (!node || animated.current) return;
    animated.current = true;
    if (prefersReducedMotion()) return;
    node.animate({ transform: [fromOrigin(node, qrBoxRef.current, originRef?.current), CENTERED] }, { duration: 420, easing: OPEN_EASE });
    node.animate({ opacity: [0, 1] }, { duration: 200, easing: 'ease-out' });
    overlayRef.current?.animate({ opacity: [0, 1] }, { duration: 300, easing: 'ease-out' });
  }, [originRef]);

  // Every close path (Esc, outside click, X, Close button) lands here: play the reverse
  // animation first, then actually close.
  const handleOpenChange = (next) => {
    if (next) return onOpenChange(true);
    const node = contentRef.current;
    if (closing.current) return;
    if (!node || prefersReducedMotion()) return onOpenChange(false);
    closing.current = true;
    [node, overlayRef.current].forEach(el => el?.getAnimations().forEach(a => a.cancel()));
    const shrink = node.animate({ transform: [CENTERED, fromOrigin(node, qrBoxRef.current, originRef?.current)] }, { duration: 300, easing: CLOSE_EASE, fill: 'forwards' });
    node.animate({ opacity: [1, 0] }, { duration: 160, delay: 140, easing: 'ease-in', fill: 'forwards' });
    overlayRef.current?.animate({ opacity: [1, 0] }, { duration: 300, easing: 'ease-in', fill: 'forwards' });
    shrink.finished.catch(() => {}).finally(() => onOpenChange(false));
  };

  return <Dialog open={open} onOpenChange={handleOpenChange}>
    <DialogContent
      ref={animateIn}
      style={{ animation: 'none' }}
      overlayProps={{ ref: overlayRef, style: { animation: 'none' } }}
      overlayClassName="z-[1100] bg-slate-950/70"
      className="z-[1101] max-w-lg max-h-[90dvh] gap-0 overflow-y-auto rounded-3xl border-emerald-100/80 bg-gradient-to-b from-emerald-50 via-white to-white p-5 shadow-2xl shadow-emerald-950/20 dark:border-slate-700 dark:from-emerald-950 dark:via-slate-900 dark:to-slate-900 sm:rounded-3xl sm:p-7 [&>button:last-child]:rounded-full [&>button:last-child]:bg-white/80 [&>button:last-child]:p-2 [&>button:last-child]:text-slate-600 dark:[&>button:last-child]:bg-slate-800 dark:[&>button:last-child]:text-slate-200"
    >
      <DialogHeader className="sr-only">
        <DialogTitle>{translate('Donation QR')}</DialogTitle>
        <DialogDescription>{name}</DialogDescription>
      </DialogHeader>
      <PaymentQrDisplay key={src} name={name} src={src} location={location} recipientLabel={recipientLabel} enlarged preloaded={asset} qrBoxRef={qrBoxRef} />
      <Button type="button" variant="ghost" className="mt-4 rounded-xl text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800" onClick={() => handleOpenChange(false)}>{translate('Close')}</Button>
    </DialogContent>
  </Dialog>;
}

// `bare`: no card chrome and no name/location header — for embedding in a page
// section that already names the recipient (e.g. MosqueDetails).
export default function PaymentQrDisplay({ name, src, location, recipientLabel, enlarged = false, preloaded = null, qrBoxRef, bare = false }) {
  const thumbRef = useRef(null);
  const [asset, setAsset] = useState(preloaded);
  const [error, setError] = useState(false);
  const [notice, setNotice] = useState('');
  const [open, setOpen] = useState(false);
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    // The modal reuses the thumbnail's already-loaded image, so it opens with the QR in place
    // instead of re-fetching and flashing "Loading...". The thumbnail owns (and revokes) the URL.
    if (preloaded && retry === 0) { setAsset(preloaded); setError(false); return; }
    const controller = new AbortController();
    let url;
    setAsset(null); setError(false); setNotice('');
    if (!src) return;
    (async () => {
      try {
        const response = await fetch(apiUrl(src), { signal: controller.signal });
        if (!response.ok) throw new Error('QR unavailable');
        const blob = await response.blob();
        const extensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
        if (!extensions[blob.type]) throw new Error('Invalid image');
        if (controller.signal.aborted) return;
        url = URL.createObjectURL(blob);
        // Decode up front so the QR box is laid out at its final size (no jump when it appears).
        const img = new Image();
        img.src = url;
        await img.decode();
        if (controller.signal.aborted) return;
        const filename = `QR-${(name || 'Derma').replace(/[^\p{L}\p{N}-]/gu, '_')}.${extensions[blob.type]}`;
        setAsset({ url, blob, file: new File([blob], filename, { type: blob.type }), filename, ratio: img.naturalWidth / img.naturalHeight || 1 });
      } catch { if (!controller.signal.aborted) setError(true); }
    })();
    return () => { controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [src, name, retry, preloaded]);

  const nativeShare = async () => {
    const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(asset.blob);
    });
    const { uri } = await Filesystem.writeFile({ path: asset.filename, data, directory: Directory.Cache });
    await Share.share({ title: name, url: uri });
  };
  const download = () => {
    const link = document.createElement('a'); link.href = asset.url; link.download = asset.filename;
    document.body.appendChild(link); link.click(); link.remove();
  };
  const act = async (share) => {
    if (!asset || busy) return;
    setBusy(true); setNotice('');
    try {
      if (Capacitor.isNativePlatform()) await nativeShare();
      else if (share && navigator.canShare?.({ files: [asset.file] })) await navigator.share({ title: name, files: [asset.file] });
      else {
        download();
        if (share) setNotice(translate('QR downloaded for sharing'));
      }
    } catch (err) {
      if (err.name !== 'AbortError') setNotice(translate('Unable to save or share QR'));
    } finally { setBusy(false); }
  };

  return <div className={`text-center ${enlarged ? 'pt-5 pb-1' : bare ? 'px-4 py-5' : 'rounded-2xl border border-emerald-100 bg-white px-4 py-7 shadow-sm dark:border-slate-600 dark:bg-slate-800 sm:px-6 sm:py-8'}`}>
    {!bare && <div className="flex flex-col items-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
        <Landmark className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="text-base font-bold leading-snug text-slate-800 dark:text-white sm:text-lg">{name}</p>
      {location && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{location}</p>}
      {recipientLabel && <span className="mt-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">{recipientLabel}</span>}
    </div>}
    <div className={`mx-auto max-w-sm ${bare ? '' : 'mt-8'}`}>
      {!src ? <div role="status" className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 dark:border-slate-600 dark:bg-slate-700/40">
        <QrCode className="h-12 w-12 text-slate-300 dark:text-slate-500" aria-hidden="true" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">{translate('No payment QR available')}</p>
        <p className="max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">{translate('This recipient has no available QR payment image.')}</p>
      </div> : error ? <div role="alert" className="space-y-3 py-8 text-sm text-slate-600">
        <p>{translate('QR image unavailable')}</p>
        <Button type="button" variant="outline" onClick={() => setRetry(n => n + 1)}>{translate('Retry')}</Button>
      </div> : enlarged ? <div ref={qrBoxRef} className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-lg shadow-emerald-900/5 ring-4 ring-emerald-50 dark:border-emerald-800 dark:ring-emerald-900/30">
          {/* Fixed-shape box: same size while loading and once loaded, so nothing jumps. */}
          <div className="mx-auto max-h-[45dvh] w-full" style={{ aspectRatio: asset?.ratio ?? 1 }}>
            {asset ? <img src={asset.url} alt={`${translate('Donation QR')} - ${name}`} className={`h-full w-full object-contain ${preloaded ? '' : 'animate-in fade-in duration-300 motion-reduce:animate-none'}`} onError={() => setError(true)} />
              : <div role="status" aria-label={translate('Loading...')} className="h-full w-full animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none dark:bg-slate-700" />}
          </div>
        </div>
        : !asset ? <p role="status" className="py-16 text-sm text-slate-500">{translate('Loading...')}</p>
        : <button type="button" className="mx-auto block w-full max-w-[224px] rounded-xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] motion-reduce:transform-none focus-visible:outline-emerald-600 focus-visible:outline-offset-4" onClick={() => setOpen(true)} aria-label={translate('Enlarge QR')}>
          <span ref={thumbRef} className="block rounded-xl border border-slate-100 bg-white p-2 shadow-sm"><img src={asset.url} alt={`${translate('Donation QR')} - ${name}`} className="h-auto max-h-72 w-full object-contain" onError={() => setError(true)} /></span>
          <span className="mt-3 block text-xs text-slate-500 dark:text-slate-400">{translate('Tap to enlarge')}</span>
        </button>}
    </div>
    <div className={`${bare ? 'mt-4' : 'mt-7'} flex flex-wrap items-center justify-center gap-1 sm:gap-3`}>
      <Button type="button" variant="ghost" aria-label={translate('Download QR')} className="gap-2 px-2 text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 sm:px-3 sm:text-sm" disabled={!asset || error || busy} onClick={() => act(false)}><Download className="h-4 w-4" />{translate('Download')}</Button>
      <Button type="button" variant="ghost" aria-label={translate('Share QR')} className="gap-2 px-2 text-xs text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 sm:px-3 sm:text-sm" disabled={!asset || error || busy} onClick={() => act(true)}><Share2 className="h-4 w-4" />{translate('Share')}</Button>
    </div>
    {notice && <p role="status" className="mt-3 text-xs text-slate-500 dark:text-slate-300">{notice}</p>}
    {!enlarged && <PaymentQrModal open={open} onOpenChange={setOpen} src={src} name={name} location={location} recipientLabel={recipientLabel} asset={asset} originRef={thumbRef} />}
  </div>;
}
