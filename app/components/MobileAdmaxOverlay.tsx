"use client";

import { useEffect } from "react";
import { useState } from "react";
import type { SyntheticEvent } from "react";

type MobileAdmaxOverlayProps = {
  mediaQuery: string;
  scriptSrc: string;
};

function scheduleOverlayLoad(callback: () => void) {
  const load = () => {
    window.setTimeout(callback, 150);
  };

  if (document.readyState === "complete") {
    load();
    return;
  }

  window.addEventListener("load", load, { once: true });
}

export function MobileAdmaxOverlay({
  mediaQuery,
  scriptSrc
}: MobileAdmaxOverlayProps) {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [hasVisibleAd, setHasVisibleAd] = useState(false);

  useEffect(() => {
    if (!window.matchMedia(mediaQuery).matches) {
      return;
    }

    scheduleOverlayLoad(() => setShouldLoad(true));
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

  if (!shouldLoad) {
    return null;
  }

  return (
    <div
      className={
        hasVisibleAd
          ? "admax-mobile-overlay admax-mobile-overlay-loaded"
          : "admax-mobile-overlay"
      }
    >
      <iframe
        className="admax-mobile-frame"
        title="広告"
        srcDoc={srcDoc}
        loading="lazy"
        onLoad={checkAdContent}
      />
    </div>
  );
}
