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
    <Image
      src={vitoAvatar(score).src}
      alt={`Vito : ${score.toFixed(1)}/10`}
      width={size}
      height={size}
      className="shrink-0 object-contain"
      style={{ width: size, height: size }}
    />
  );
}
