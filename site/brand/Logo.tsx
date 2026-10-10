// 站点的字标和小标记：页面用 Wordmark 画站名（size 是高度，单位像素），RingMark 是小标记，闪烁光标就是加载动画。
// 标记是“对话光标”：一个对话气泡里有提示符和方块光标。提示符和光标从气泡里镂空，透出底色，深浅两种外观都适用。
// 图形与 logo.svg、图标、分享图字标同源（.data/logo/build.mjs 生成）；改形状时一起重新生成。
import { useId } from "react";
import { SITE } from "../site.ts";

const MARK_BOX = { x: 96, y: 103, size: 320 };
const BUBBLE = "M200 116H312C379.2 116 408 144.8 408 212V256C408 323.2 379.2 352 312 352H222C192 352 168 374 140 410C150 372 104 360 104 300V212C104 144.8 132.8 116 200 116Z";
const PROMPT = "M196 188L252 234L196 280";
// 光标闪烁：blink 一直闪（加载动画）；intro 打开页面时闪 3 下后停住，鼠标停在字标上时接着闪。减少动态效果时都不闪。
const MOTION = "@keyframes vd-blink{50%{opacity:0}}.vd-blink{animation:vd-blink 1.1s steps(1) infinite}"
  + ".vd-intro{animation:vd-blink 1.1s steps(1) 3}.vd-wordmark:hover .vd-intro{animation-iteration-count:infinite}"
  + "@media (prefers-reduced-motion:reduce){.vd-blink,.vd-intro{animation:none}}";

function BubbleMark({ className = "", motion }: { className?: string; motion?: "blink" | "intro" }) {
  const id = `vd-mark-${useId().replace(/[^\w-]/g, "")}`;
  const { x, y, size } = MARK_BOX;
  return (
    <svg viewBox={`${x} ${y} ${size} ${size}`} className={className} aria-hidden="true">
      {motion && <style>{MOTION}</style>}
      <mask id={id} maskUnits="userSpaceOnUse" x={x} y={y} width={size} height={size}>
        <path d={BUBBLE} fill="#fff" />
        <path d={PROMPT} fill="none" stroke="#000" strokeWidth="32" strokeLinecap="round" strokeLinejoin="round" />
        <rect className={motion && `vd-${motion}`} x="278" y="182" width="52" height="104" rx="8" fill="#000" />
      </mask>
      <rect x={x} y={y} width={size} height={size} fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}

export function Wordmark({ size = 24, className = "", title = SITE.name }: { size?: number; className?: string; title?: string }) {
  return (
    <span className={`vd-wordmark inline-flex items-center font-black leading-none tracking-[-0.03em] ${className}`} style={{ fontSize: Math.round(size * 0.92) }} aria-label={title} role="img">
      {/* 气泡主体在标记框里偏上，下移一点，让主体与字的中线对齐 */}
      <BubbleMark className="relative top-[0.1em] mr-[0.26em] size-[1.38em] shrink-0 text-accent" motion="intro" />
      <span aria-hidden="true">{SITE.name}</span>
    </span>
  );
}

/** The small mark; with `spinning`, its cursor blinks as the loader (the name is kept for the framework's call sites). */
export function RingMark({ className = "", spinning = false }: { className?: string; spinning?: boolean }) {
  return <BubbleMark className={className} motion={spinning ? "blink" : undefined} />;
}
