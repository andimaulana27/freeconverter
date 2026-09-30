import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
};

export function Article({ title, children }: Props) {
  return (
    <article className="flex max-w-2xl flex-col gap-4 text-sm leading-7 text-ink">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {children}
    </article>
  );
}
