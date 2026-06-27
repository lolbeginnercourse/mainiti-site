"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    if (!window.matchMedia(mediaQuery).matches) {
      return;
    }

    scheduleOverlayLoad(() => {
      const script = document.createElement("script");
      script.src = scriptSrc;
      script.async = false;
      document.body.appendChild(script);
    });
  }, [mediaQuery, scriptSrc]);

  return null;
}
