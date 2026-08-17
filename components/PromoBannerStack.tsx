"use client";

import { useCallback, useEffect, useState } from "react";
import { WhatsAppCommunityBanner } from "@/components/WhatsAppCommunityBanner";
import {
  CUSTODYNOTE_BANNER_DISMISSED_KEY,
  CustodyNoteTopBanner,
} from "@/components/CustodyNoteTopBanner";
import { PromoRestoreBar } from "@/components/PromoRestoreBar";
import {
  clearPinnedOnScroll,
  SCROLL_HIDE_PX,
  shouldCollapsePromos,
} from "@/lib/promo-banner-scroll";

/**
 * Sticky top promos. On narrow viewports, start collapsed so the directory/
 * header CTAs stay visible; CustodyNote banner is desktop-only.
 */
export function PromoBannerStack() {
  const [collapsed, setCollapsed] = useState(true);
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [cnDismissed, setCnDismissed] = useState(false);
  const [showCustodyNoteBanner, setShowCustodyNoteBanner] = useState(false);

  useEffect(() => {
    try {
      setCnDismissed(
        localStorage.getItem(CUSTODYNOTE_BANNER_DISMISSED_KEY) === "1",
      );
    } catch {
      setCnDismissed(false);
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => {
      const desktop = mq.matches;
      setShowCustodyNoteBanner(desktop);
      // Expand by default on desktop only; stay collapsed on mobile.
      if (desktop && window.scrollY <= SCROLL_HIDE_PX) {
        setCollapsed(false);
      } else if (!desktop) {
        setCollapsed(true);
        setPinnedOpen(false);
      }
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onScroll = () => {
      const scrollY = window.scrollY;
      const desktop = mq.matches;
      setPinnedOpen((prevPinned) => {
        const nextPinned = clearPinnedOnScroll(
          scrollY,
          prevPinned,
          SCROLL_HIDE_PX,
        );
        setCollapsed((prevCollapsed) => {
          // Mobile stays collapsed unless the user pinned open via the restore bar.
          if (!desktop && !nextPinned) return true;
          return shouldCollapsePromos(scrollY, nextPinned, prevCollapsed);
        });
        return nextPinned;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleExpand = useCallback(() => {
    setPinnedOpen(true);
    setCollapsed(false);
  }, []);

  const handleCnDismissChange = useCallback((dismissed: boolean) => {
    setCnDismissed(dismissed);
  }, []);

  return (
    <div aria-label="Site promotions">
      <div
        className={`promo-banner-stack-inner ${collapsed ? "is-collapsed" : "is-expanded"}`}
        aria-hidden={collapsed}
      >
        <div className="promo-banner-stack-content">
          <WhatsAppCommunityBanner />
          {showCustodyNoteBanner ? (
            <CustodyNoteTopBanner onDismissChange={handleCnDismissChange} />
          ) : null}
        </div>
      </div>
      {collapsed && (
        <PromoRestoreBar
          cnDismissed={cnDismissed || !showCustodyNoteBanner}
          onExpand={handleExpand}
        />
      )}
    </div>
  );
}
