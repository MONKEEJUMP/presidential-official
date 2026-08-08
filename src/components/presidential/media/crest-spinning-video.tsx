"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useAdultVideoPlayback } from "@/lib/browser/adult-video-playback";

const CREST_SPINNING_POSTER = "/media/posters/crest-spinning.jpg";

export function CrestSpinningVideo() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);
  const { canStream, videoRef } = useAdultVideoPlayback(mountRef);
  const shouldPlayVideo = canStream && !videoFailed;

  return (
    <div
      className="absolute inset-[clamp(1rem,4vmin,3rem)]"
      ref={mountRef}
    >
      <Image
        alt=""
        aria-hidden="true"
        className="object-contain"
        fill
        priority
        sizes="(min-width: 1536px) 1392px, 100vw"
        src={CREST_SPINNING_POSTER}
      />

      {shouldPlayVideo ? (
        <video
          aria-hidden="true"
          autoPlay
          className="absolute inset-0 h-full w-full object-contain"
          loop
          muted
          onError={() => setVideoFailed(true)}
          playsInline
          poster={CREST_SPINNING_POSTER}
          preload="metadata"
          ref={videoRef}
        >
          <source src="/media/backdrops/crest-spinning.webm" type="video/webm" />
          <source src="/media/backdrops/crest-spinning.mp4" type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
