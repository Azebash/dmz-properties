import { BrandMark } from "@/components/brand-mark";

type BrandLockupProps = {
  className?: string;
};

export function BrandLockup({ className = "" }: BrandLockupProps) {
  return (
    <span className={`wordmark ${className}`.trim()}>
      <BrandMark className="wordmark-symbol" />
      <span className="wordmark-descriptor">Properties</span>
    </span>
  );
}
