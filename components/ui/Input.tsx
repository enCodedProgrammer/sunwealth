import { useId } from "react";
import { cn } from "@/lib/cn";

type InputProps = React.ComponentPropsWithoutRef<"input"> & {
  label: string;
  error?: string;
  helper?: string;
  ref?: React.Ref<HTMLInputElement>;
};

export function Input({
  label,
  error,
  helper,
  id,
  className,
  ref,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const describedBy =
    [error ? errorId : null, helper && !error ? helperId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 px-4 bg-paper border border-stone rounded-sm text-base text-ink",
          "placeholder:text-stone",
          "focus:border-gold",
          error && "border-ember",
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="text-sm text-ember">
          {error}
        </p>
      ) : helper ? (
        <p id={helperId} className="text-sm text-stone">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
