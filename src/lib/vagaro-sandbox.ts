/**
 * Vagaro Iframe Sandbox
 *
 * Vagaro's embedded widget ships with a merchant-admin "Return URL" config
 * that sends users to the old Squarespace lashpop site as soon as a booking
 * completes — kicking them off our app before they can interact with the
 * branded confirmation overlay. It manifests two ways depending on Vagaro's
 * build: a top-navigation OR a popup (window.open / target=_blank) to
 * lashpopstudios.com.
 *
 * We can't change the Vagaro setting, but we CAN sandbox the iframe to revoke
 * TOP-NAVIGATION (omitting `allow-top-navigation*`), which blocks the
 * top-navigation variant of the redirect.
 *
 * Popups are deliberately KEPT enabled (`allow-popups` +
 * `allow-popups-to-escape-sandbox`): the widget opens real popups mid-flow —
 * "Log in with Google" OAuth, card capture — and revoking popups breaks those.
 * Sandbox flags can't distinguish a good popup (Google) from the bad one (the
 * end-of-booking redirect), so the popup variant of the redirect is handled at
 * a different layer: BookingModal tears the Vagaro iframe out of the DOM the
 * instant the `BookingCompleted` postMessage arrives, so Vagaro's redirect code
 * has no live document left to open the popup from. See BookingModal.tsx.
 *
 * Subtleties this util handles that a simple `setAttribute('sandbox', ...)`
 * misses — and which were causing desktop (but not mobile) to redirect:
 *
 *   1. MutationObserver callbacks run as a microtask AFTER the iframe is
 *      inserted. On fast desktop browsers (Chrome especially) the browsing
 *      context is already created without sandbox by the time we run, so
 *      setting `sandbox` then is a no-op for the live document — top-
 *      navigation slips through at the end of the booking flow.
 *
 *      Fix: as soon as we observe a new Vagaro iframe, we capture its src,
 *      blank it to about:blank, set the sandbox attribute, then re-assign
 *      src on the next animation frame. The iframe now navigates INTO the
 *      sandbox, so the browsing context inherits the restriction.
 *
 *   2. Vagaro's loader script may inject iframes into document.body
 *      directly (not into the container we control), depending on layout.
 *      We observe BOTH the widget container and document.body to catch
 *      those too.
 *
 *   3. Vagaro sometimes creates an iframe with no src and assigns it
 *      asynchronously. We observe `src` attribute mutations to catch the
 *      reassignment and re-apply the reload trick.
 *
 * Returns a cleanup function that disconnects the observer.
 */

// Popups ARE allowed — the widget needs them for "Log in with Google" OAuth
// and card capture. The unwanted post-booking redirect popup is suppressed by
// tearing down the iframe on BookingCompleted (see this file's header and
// BookingModal.tsx), not by revoking popup permission.
const SANDBOX =
  'allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-modals';

const SANDBOXED_FLAG = 'data-lp-sandboxed';

function isVagaroIframe(frame: HTMLIFrameElement): boolean {
  const src = frame.getAttribute('src') || '';
  if (src.includes('vagaro.com')) return true;
  // Vagaro embeds the widget inside the `.vagaro` div our embed code
  // creates. Match iframes nested in that container even if their src
  // hasn't been assigned yet (Vagaro sometimes creates iframes with
  // no/blank src and sets src after).
  if (frame.closest('.vagaro')) return true;
  return false;
}

function sandboxIframe(frame: HTMLIFrameElement): void {
  if (frame.hasAttribute(SANDBOXED_FLAG)) return;
  if (!isVagaroIframe(frame)) return;

  frame.setAttribute(SANDBOXED_FLAG, '1');
  frame.setAttribute('sandbox', SANDBOX);

  // Earlier we tried an about:blank reload trick here to force the iframe
  // to navigate INTO the sandbox (late-applied sandbox is a no-op on the
  // live document). That broke Vagaro's widget init handshake — the
  // widget got stuck on the loading state because the postMessage ready
  // sequence didn't survive the forced reload. The fallback below
  // (beforeunload guard during the confirmation window) covers the
  // desktop redirect without touching the iframe document.
}

function scanForIframes(root: ParentNode): void {
  root.querySelectorAll('iframe').forEach((f) => sandboxIframe(f as HTMLIFrameElement));
}

/**
 * Install the Vagaro iframe sandbox.
 *
 * @param container - The widget container element. We also observe
 *   document.body in case Vagaro injects iframes outside this scope.
 * @returns Cleanup function to disconnect observers.
 */
export function installVagaroIframeSandbox(container: HTMLElement): () => void {
  if (typeof window === 'undefined') return () => {};

  // ── Deterministic block: sandbox iframes at CREATION time ──
  // The MutationObserver below sees iframes only AFTER they're inserted, by
  // which point a fast desktop browser has already created the browsing
  // context unsandboxed — setting `sandbox` then does nothing, so Vagaro's
  // post-booking top-navigation to the old Squarespace site slips through
  // (subtlety #1 in this file's header). The reliable fix is to set `sandbox`
  // the instant the iframe element is constructed, BEFORE Vagaro assigns its
  // src: the browsing context is then created sandboxed and the redirect is
  // silently blocked (no `allow-top-navigation*`), with no reload to break the
  // widget's postMessage handshake (the about:blank trick we tried did break
  // it). The patch is scoped to this widget's lifetime and self-restores.
  const originalCreateElement = document.createElement.bind(document);
  const patchedCreateElement = function (
    this: Document,
    tagName: string,
    options?: ElementCreationOptions
  ): HTMLElement {
    const el = originalCreateElement(tagName as 'iframe', options);
    if (typeof tagName === 'string' && tagName.toLowerCase() === 'iframe') {
      const frame = el as HTMLIFrameElement;
      // Pre-sandbox optimistically. Vagaro creates its iframe inside the
      // `.vagaro` container, sets src to a vagaro.com URL, and runs the booking
      // flow under `allow-scripts/same-origin/forms/popups/modals` just fine —
      // only top-navigation is revoked.
      frame.setAttribute('sandbox', SANDBOX);
      frame.setAttribute(SANDBOXED_FLAG, '1');
      // Protect unrelated iframes (chat/analytics widgets that might be created
      // while the booking modal is open): on the next microtask, if this frame
      // turned out NOT to be Vagaro's, strip the sandbox we pre-applied. Doing
      // it before the context is navigated is effective; if it already
      // navigated this is a harmless no-op. Genuine Vagaro frames are kept
      // sandboxed, and the MutationObserver below re-applies as a backstop.
      queueMicrotask(() => {
        if (!isVagaroIframe(frame)) {
          frame.removeAttribute('sandbox');
          frame.removeAttribute(SANDBOXED_FLAG);
        }
      });
    }
    return el;
  };
  // We only special-case the string-tag iframe path and defer everything else
  // to the native impl; the cast bridges our narrower signature to the wider
  // overloaded one.
  document.createElement = patchedCreateElement as typeof document.createElement;

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        for (const node of Array.from(m.addedNodes)) {
          if (!(node instanceof HTMLElement)) continue;
          if (node.tagName === 'IFRAME') {
            sandboxIframe(node as HTMLIFrameElement);
          } else {
            scanForIframes(node);
          }
        }
      } else if (
        m.type === 'attributes' &&
        m.target instanceof HTMLIFrameElement
      ) {
        sandboxIframe(m.target);
      }
    }
  });

  // Observe the widget container (catches the primary iframe) AND
  // document.body (catches any iframe Vagaro injects outside our
  // container — e.g., payment shims, popups, captcha frames). On
  // desktop the loader sometimes attaches iframes to document.body
  // that the container-scoped observer would miss.
  const observeOptions: MutationObserverInit = {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src'],
  };
  observer.observe(container, observeOptions);
  if (document.body && document.body !== container) {
    observer.observe(document.body, observeOptions);
  }

  // Catch iframes that already exist anywhere in the document.
  scanForIframes(document);

  return () => {
    observer.disconnect();
    // Restore the native createElement only if nothing else re-patched it in
    // the meantime (avoid clobbering an unrelated wrapper).
    if (document.createElement === patchedCreateElement) {
      document.createElement = originalCreateElement;
    }
  };
}
