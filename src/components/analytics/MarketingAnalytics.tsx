'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    fbq?: (...args: unknown[]) => void
    _fbq?: (...args: unknown[]) => void
  }
}

const GTM_ID_RE = /^GTM-[A-Z0-9]+$/
const META_PIXEL_ID_RE = /^\d+$/

/**
 * Preserves the tracking identities from the Squarespace site without putting
 * either vendor in the critical rendering path. IDs are deployment config,
 * and invalid values are ignored rather than interpolated into inline script.
 */
export function MarketingAnalytics() {
  const pathname = usePathname()
  const initialPageTracked = useRef(false)
  const rawGtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || ''
  const rawMetaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || ''
  const gtmId = GTM_ID_RE.test(rawGtmId) ? rawGtmId : null
  const metaPixelId = META_PIXEL_ID_RE.test(rawMetaPixelId) ? rawMetaPixelId : null

  useEffect(() => {
    // Both bootstrap snippets record the initial document view. Only emit
    // another view when the App Router changes pages without a full reload.
    if (!initialPageTracked.current) {
      initialPageTracked.current = true
      return
    }

    const pagePath = `${pathname}${window.location.search}`
    if (gtmId) {
      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'virtual_page_view',
        page_location: window.location.href,
        page_path: pagePath,
        page_title: document.title,
      })
    }
    if (metaPixelId && typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }, [gtmId, metaPixelId, pathname])

  return (
    <>
      {gtmId ? (
        <>
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              title="Google Tag Manager"
              className="hidden invisible"
            />
          </noscript>
        </>
      ) : null}

      {metaPixelId ? (
        <Script id="meta-pixel" strategy="lazyOnload">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  )
}
