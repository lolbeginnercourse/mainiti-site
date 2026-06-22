"use client";

import { useEffect, useState } from "react";

type LazyAdmaxSlotProps = {
  className: string;
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
  scriptSrc,
  title
}: LazyAdmaxSlotProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    scheduleAdLoad(() => setShouldLoad(true));
  }, []);

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

  return (
    <div className={className}>
      {shouldLoad ? (
        <iframe
          className="admax-frame"
          title={title}
          srcDoc={srcDoc}
          loading="lazy"
        />
      ) : null}
    </div>
  );
}
