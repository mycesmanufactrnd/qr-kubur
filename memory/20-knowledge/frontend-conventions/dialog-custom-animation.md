# Custom open/close animation on a Radix dialog

Pattern used by `PaymentQrModal` (`src/components/PaymentQrDisplay.jsx`): the QR grows out of the
tapped thumbnail and shrinks back into it.

- Turn off the CSS enter/exit animations with inline `style={{ animation: 'none' }}` on
  `DialogContent`, and on the overlay via `overlayProps` (`src/components/ui/dialog.jsx`). Radix then
  unmounts immediately on close, so the close animation must run **before** calling
  `onOpenChange(false)`. Route every close path (Esc, outside click, X, custom Close button) through
  one handler.
- Animate with `element.animate()` from a callback ref on `DialogContent`. Keyframes must keep
  `translate(-50%, -50%)`, because it's the content's resting transform.
- **Pitfall:** Radix re-attaches the content ref several times while it opens. If you animate on
  every attach, a later attach measures the element mid-animation and computes an identity start
  frame, which shows as a one-frame full-size flash. Animate only on the first attach per open, and
  reset the flag when `open` becomes false.
- Don't animate over `backdrop-blur`, because it drops frames on Android WebView.
- Respect `prefers-reduced-motion`: skip the animations and close immediately.

Parent: [[index|frontend-conventions/]].
