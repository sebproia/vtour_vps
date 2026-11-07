import Image from "next/image";
import { vitoAvatar, validScore } from "@/lib/recap-summary";
export default function VitoSticker({
  score,
  size = 64,
}: {
  score: number | null;
  size?: number;
}) {
  if (!validScore(score)) return null;
  return (
    <span
      aria-hidden="true"
      className="relative inline-block shrink-0 align-middle"
      style={{ width: size, height: size }}
    >
      <Image
        src={vitoAvatar(score).src}
        alt=""
        unoptimized
        loading="eager"
        width={size}
        height={size}
        className="pointer-events-none select-none object-contain scale-[1.2]"
        style={{ width: size, height: size }}
      />
    </span>
  );
}
