"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

const ADULT_CONFIRMATION_EVENT = "presidential:adult-confirmation";
const ADULT_CONFIRMATION_DATA_KEY = "presidentialAdultConfirmed";

type AdultConfirmationEvent = CustomEvent<{
  readonly confirmed: boolean;
}>;

function adultConfirmationFromDocument(): boolean {
  return (
    document.documentElement.dataset[ADULT_CONFIRMATION_DATA_KEY] === "true"
  );
}

function releaseVideo(video: HTMLVideoElement) {
  video.pause();
  video.removeAttribute("src");
  video.querySelectorAll("source").forEach((source) => {
    source.removeAttribute("src");
  });

  try {
    video.load();
  } catch {
    // Detached media can reject load() during teardown; its sources are gone.
  }
}

export function publishAdultConfirmation(confirmed: boolean) {
  document.documentElement.dataset[ADULT_CONFIRMATION_DATA_KEY] = String(confirmed);
  window.dispatchEvent(
    new CustomEvent(ADULT_CONFIRMATION_EVENT, {
      detail: { confirmed },
    }),
  );
}

export function useAdultVideoPlayback<T extends Element>(
  visibilityTargetRef?: RefObject<T | null>,
) {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const [adultConfirmed, setAdultConfirmed] = useState(
    () =>
      typeof document !== "undefined" && adultConfirmationFromDocument(),
  );
  const [isInViewport, setIsInViewport] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () =>
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [pageIsVisible, setPageIsVisible] = useState(
    () =>
      typeof document !== "undefined" &&
      document.visibilityState === "visible",
  );

  useEffect(() => {
    const handleAdultConfirmation = (event: Event) => {
      setAdultConfirmed(
        (event as AdultConfirmationEvent).detail?.confirmed === true,
      );
    };

    window.addEventListener(ADULT_CONFIRMATION_EVENT, handleAdultConfirmation);
    const syncRequest = window.requestAnimationFrame(() => {
      setAdultConfirmed(adultConfirmationFromDocument());
    });

    return () => {
      window.cancelAnimationFrame(syncRequest);
      window.removeEventListener(ADULT_CONFIRMATION_EVENT, handleAdultConfirmation);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    mediaQuery.addEventListener("change", updateMotionPreference);

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
    };
  }, []);

  useEffect(() => {
    const updatePageVisibility = () => {
      setPageIsVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", updatePageVisibility);

    return () => {
      document.removeEventListener("visibilitychange", updatePageVisibility);
    };
  }, []);

  useEffect(() => {
    const target = visibilityTargetRef?.current ?? videoElementRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      setIsInViewport(Boolean(entry?.isIntersecting && entry.intersectionRatio > 0));
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [visibilityTargetRef]);

  const canStream =
    adultConfirmed &&
    isInViewport &&
    !prefersReducedMotion &&
    pageIsVisible;

  const videoRef = useCallback((video: HTMLVideoElement | null) => {
    const previousVideo = videoElementRef.current;

    if (previousVideo && previousVideo !== video) {
      releaseVideo(previousVideo);
    }

    videoElementRef.current = video;
  }, []);

  useEffect(() => {
    const video = videoElementRef.current;

    if (!video) {
      return;
    }

    if (!canStream) {
      releaseVideo(video);
      return;
    }

    video.load();
    void video.play().catch(() => {
      // Muted autoplay may retry when the browser finishes loading the source.
    });
  }, [canStream]);

  useEffect(
    () => () => {
      if (videoElementRef.current) {
        releaseVideo(videoElementRef.current);
      }
    },
    [],
  );

  return { canStream, videoRef } as const;
}
