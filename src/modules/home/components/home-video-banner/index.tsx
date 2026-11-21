"use client"

import { clx } from "@medusajs/ui"
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react"
import { useIntersection } from "@lib/hooks/use-in-view"
import { DEFAULT_MOBILE_HEIGHT, type HomeBanner } from "@lib/util/home-banner"
import { normalizeImageUrl } from "@lib/util/image-url"

/**
 * How far ahead of the screen the file is attached. Until then the <video> has
 * no `src`, so nothing of it is requested: it never competes with the hero or
 * the Best Sellers for the connection, and a visitor who does not scroll this
 * far never downloads it at all.
 */
const LOAD_AHEAD = "300px 0px"

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

type Connection = {
  saveData?: boolean
  effectiveType?: string
  addEventListener?: (type: "change", listener: () => void) => void
  removeEventListener?: (type: "change", listener: () => void) => void
}

const getConnection = () =>
  (navigator as Navigator & { connection?: Connection }).connection

/** A visitor who asked to save data, or is on a very slow line, is not sent a video. */
const sparesData = () => {
  const connection = getConnection()

  return (
    !!connection &&
    (!!connection.saveData || /(^|-)2g$/.test(connection.effectiveType ?? ""))
  )
}

/** Whether a moving banner is welcome: not when the visitor asked for less motion or less data. */
const subscribe = (onChange: () => void) => {
  const motion = window.matchMedia(REDUCED_MOTION)
  const connection = getConnection()

  motion.addEventListener("change", onChange)
  connection?.addEventListener?.("change", onChange)

  return () => {
    motion.removeEventListener("change", onChange)
    connection?.removeEventListener?.("change", onChange)
  }
}

const getMotionAllowed = () =>
  !window.matchMedia(REDUCED_MOTION).matches && !sparesData()

/**
 * The campaign video under the Best Sellers: full width, silent, looping, and
 * nothing that looks like a player. Its settings come from the store's
 * metadata (`getHomeBanner()`), so the admin changes the video and the heights.
 *
 * Shape. Below 1024 px the banner is a fixed height (420 px unless the admin
 * sets one) and the video is cropped to the middle of its frame; from 1024 px up
 * it keeps the video's own 3:1 proportions, so the whole picture shows at any
 * width, unless the admin sets a height. `object-cover` fills the box without
 * ever stretching or squeezing the picture, and `object-center` keeps the
 * middle of the frame in view.
 *
 * Loading and playback. The file is attached when the banner is about to come
 * on screen (`LOAD_AHEAD`), plays while it is visible and pauses when it is not.
 * `muted` and `playsInline` are what browsers require before they autoplay;
 * when one refuses anyway (iOS in Low Power Mode) `play()` rejects and the still
 * image simply stays. Visitors who prefer reduced motion or are saving data get
 * the still image only, and the video is never requested.
 *
 * The still image is a plain <img> under the video rather than the `poster`
 * attribute: `object-cover` crops it exactly like the video, it loads lazily at
 * low priority, and the video fades in over it once it is really playing, so
 * there is never a black frame, a bar or a jump. The band is reserved at its
 * final height from the first paint, so nothing moves when either arrives.
 *
 * It is decoration, so it is hidden from assistive technology and has no
 * controls, no focus stop and no pointer events.
 */
export default function HomeVideoBanner({ banner }: { banner: HomeBanner }) {
  const frame = useRef<HTMLDivElement>(null)
  const player = useRef<HTMLVideoElement>(null)

  const nearScreen = useIntersection(frame, LOAD_AHEAD)
  const onScreen = useIntersection(frame, "0px")
  const motionAllowed = useSyncExternalStore(
    subscribe,
    getMotionAllowed,
    () => true
  )

  // Once the banner has come near the screen the file stays attached, so
  // scrolling away and back does not start it over.
  const [reached, setReached] = useState(false)
  if (nearScreen && !reached) setReached(true)

  const [playing, setPlaying] = useState(false)
  const [failed, setFailed] = useState(false)

  const attached = reached && motionAllowed && !failed

  useEffect(() => {
    const video = player.current
    if (!video) return

    if (attached && onScreen) {
      video.muted = true
      // A refusal (autoplay blocked, file gone) is not an error worth showing:
      // the still image is already there.
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [attached, onScreen])

  const videoUrl = normalizeImageUrl(banner.video)
  const stillUrl = normalizeImageUrl(banner.poster)

  // A file that cannot be played, with no still image to fall back on, would
  // leave an empty band: better no banner than that.
  if (failed && !stillUrl) return null

  const style = {
    "--banner-h-mobile": `${banner.heightMobile ?? DEFAULT_MOBILE_HEIGHT}px`,
    ...(banner.heightDesktop
      ? { "--banner-h-desktop": `${banner.heightDesktop}px` }
      : {}),
  } as CSSProperties

  return (
    <div
      ref={frame}
      aria-hidden="true"
      style={style}
      className={clx(
        // The rail above and the product grid below each carry their own
        // spacing, so the banner brings the gap that rail would have given.
        "relative w-full overflow-hidden bg-surface-card mb-12 small:mb-24",
        "h-[var(--banner-h-mobile)]",
        banner.heightDesktop
          ? "small:h-[var(--banner-h-desktop)]"
          : // 3:1 is the video's own shape (1920×640); the cap keeps it from
            // outgrowing the screen on a very wide monitor.
            "small:h-auto small:aspect-[3/1] small:max-h-[90vh]"
      )}
    >
      {stillUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stillUrl}
          alt=""
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
      )}
      <video
        ref={player}
        src={attached ? videoUrl : undefined}
        autoPlay
        muted
        loop
        playsInline
        preload={attached ? "auto" : "none"}
        disablePictureInPicture
        disableRemotePlayback
        tabIndex={-1}
        onPlaying={() => setPlaying(true)}
        onError={() => setFailed(true)}
        className={clx(
          "banner-video pointer-events-none absolute inset-0 h-full w-full object-cover object-center",
          "transition-opacity duration-700 motion-reduce:transition-none",
          playing ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  )
}
