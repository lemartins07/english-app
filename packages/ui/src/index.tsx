import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { forwardRef } from "react";

export type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", style, ...props }, ref) => {
    const baseStyle: CSSProperties = {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 8,
      padding: "8px 16px",
      fontSize: 14,
      fontWeight: 600,
      lineHeight: "20px",
      cursor: "pointer",
      border: "1px solid transparent",
      transition: "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
    };

    const variantStyles: Record<NonNullable<ButtonProps["variant"]>, CSSProperties> = {
      primary: {
        backgroundColor: "#111",
        color: "#fff",
      },
      secondary: {
        backgroundColor: "#f4f4f5",
        color: "#18181b",
        borderColor: "#d4d4d8",
      },
    };

    return (
      <button
        ref={ref}
        className={className}
        style={{ ...baseStyle, ...variantStyles[variant], ...style }}
        {...props}
      />
    );
  },
);

export const UiVersion = "0.1.0";
