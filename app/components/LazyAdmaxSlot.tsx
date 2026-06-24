"use client";

import { useEffect, useState } from "react";
import type { SyntheticEvent } from "react";

type LazyAdmaxSlotProps = {
  className: string;
  collapseUntilLoaded?: boolean;
  mediaQuery?: string;
  scriptSrc: string;
  title: string;
};

function scheduleAdLoad(callback: () => void) {
  const load = () => {
    const requestIdleCallback = window.requestIdleCallback;

    if (requestIdleCallback) {
      requestIdleCallback(callback, { timeout: 2500 });
      return;
    }

    window.setTimeout(callback, 1200);
  };

  if (document.readyState === "complete") {
    load();
    return;
  }

  window.addEventListener("load", load, { once: true });
}

export function LazyAdmaxSlot({
  className,
  collapseUntilLoaded = false,
  mediaQuery,
  scriptSrc,
  title
}: LazyAdmaxSlotProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasVisibleAd, setHasVisibleAd] = useState(!collapseUntilLoaded);

  useEffect(() => {
    if (mediaQuery && !window.matchMedia(mediaQuery).matches) {
      return;
    }

    scheduleAdLoad(() => setShouldLoad(true));
  }, [mediaQuery]);

  const srcDoc = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      html,body{margin:0;padding:0;background:transparent;text-align:center;overflow:hidden;}
    </style>
  </head>
  <body>
    <!-- admax -->
    <script src="${scriptSrc}"></script>
    <!-- admax -->
  </body>
</html>`;

  function checkAdContent(event: SyntheticEvent<HTMLIFrameElement>) {
    if (!collapseUntilLoaded) {
      return;
    }

    const frame = event.currentTarget;
    let attempts = 0;

    const check = () => {
      attempts += 1;

      try {
        const doc = frame.contentDocument;
        const hasRenderedAd = !!doc?.body?.querySelector(
          "iframe,img,object,embed"
        );

        if (hasRenderedAd) {
          setHasVisibleAd(true);
          return;
        }
      } catch {
        setHasVisibleAd(true);
        return;
      }

      if (attempts < 12) {
        window.setTimeout(check, 500);
      }
    };

    check();
  }

  const slotClassName =
    hasVisibleAd || !collapseUntilLoaded
      ? `${className} admax-slot-loaded`
      : `${className} admax-slot-collapsed`;

  return (
    <div className={slotClassName}>
      {shouldLoad ? (
        <iframe
          className="admax-frame"
          title={title}
          srcDoc={srcDoc}
          loading="lazy"
          onLoad={checkAdContent}
        />
      ) : null}
    </div>
  );
}
