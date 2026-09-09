import { useEffect } from "react";

// Keeps the browser tab title in sync with whichever page is showing.
// Without this every route shared the same static title, which leaves
// screen reader users (and anyone with several tabs open) with no way to
// tell pages apart -- WCAG 2.4.2 Page Titled.
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} \u00b7 SipLog` : "SipLog";
  }, [title]);
}
