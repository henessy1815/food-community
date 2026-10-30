import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

export const textVariants = [
  "display-lg",
  "display-md",
  "display-sm",
  "heading-lg",
  "heading-md",
  "heading-sm",
  "body-lg",
  "body-md",
  "label-lg",
  "label-md",
] as const;

export type TextVariant = (typeof textVariants)[number];

const defaultElement: Record<TextVariant, ElementType> = {
  "display-lg": "h1",
  "display-md": "h1",
  "display-sm": "h2",
  "heading-lg": "h2",
  "heading-md": "h3",
  "heading-sm": "h4",
  "body-lg": "p",
  "body-md": "p",
  "label-lg": "span",
  "label-md": "span",
};

type TextProps<T extends ElementType> = {
  variant: TextVariant;
  as?: T;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function Text<T extends ElementType = "span">({
  variant,
  as,
  className,
  children,
  ...rest
}: TextProps<T>) {
  const Component = as ?? defaultElement[variant];
  return (
    <Component className={`${variant} ${className ?? ""}`.trim()} {...rest}>
      {children}
    </Component>
  );
}
