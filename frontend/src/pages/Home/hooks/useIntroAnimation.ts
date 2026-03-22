/**
 * useIntroAnimation
 *
 * Checks sessionStorage so the intro plays only once per browser session.
 * Call `dismiss()` in IntroOverlay's `onComplete` prop to mark it as seen.
 */
import { useState } from "react";

const SESSION_KEY = "hhkungfu_intro_seen";

export function useIntroAnimation() {
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return false;
    }
  });

  const dismiss = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // ignore — private browsing may block sessionStorage
    }
    setShowIntro(false);
  };

  return { showIntro, dismiss };
}