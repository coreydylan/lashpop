/**
 * Vagaro Iframe Sandbox
 *
 * Vagaro's embedded widget ships with a merchant-admin "Return URL" config
 * that top-navigates to the old Squarespace lashpop site as soon as a
 * booking completes — kicking users off our app before they can interact
 * with the branded confirmation overlay.
 *
 * We can't change the Vagaro setting, but we CAN sandbox the iframe to
 * revoke top-navigation capability. `allow-scripts/forms/same-origin/popups/
 * modals` keep the widget functional; omitting `allow-top-navigation*`
 * blocks the redirect.
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

  // Mark FIRST so the src-mutation we trigger below doesn't reentrantly
  // call this handler.
  frame.setAttribute(SANDBOXED_FLAG, '1');
  frame.setAttribute('sandbox', SANDBOX);

  // Force the iframe to (re-)navigate UNDER the sandbox attribute. On
  // desktop, the iframe's browsing context is created at insertion time
  // — setting sandbox after the fact doesn't apply to the live document,
  // so top-navigation from the booking completion still works. Blanking
  // src and re-assigning it next frame guarantees the document loads
  // inside the sandbox.
  const currentSrc = frame.getAttribute('src');
  if (currentSrc && currentSrc !== 'about:blank') {
    frame.setAttribute('src', 'about:blank');
    requestAnimationFrame(() => {
      frame.setAttribute('src', currentSrc);
    });
  }
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

  return () => observer.disconnect();
}
