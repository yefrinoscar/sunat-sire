import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  hover?: boolean;
  as?: "div" | "a";
  href?: string;
};

export default function BezelCard({ children, className = "", innerClassName = "", hover = false, as = "div", href }: Props) {
  const shell = ["bezel", hover ? "bezel-hover" : "", className].filter(Boolean).join(" ");
  const inner = ["bezel-inner", innerClassName].filter(Boolean).join(" ");

  if (as === "a" && href) {
    return (
      <a href={href} className={`${shell} no-underline text-inherit block`}>
        <div className={inner}>{children}</div>
      </a>
    );
  }

  return (
    <div className={shell}>
      <div className={inner}>{children}</div>
    </div>
  );
}
