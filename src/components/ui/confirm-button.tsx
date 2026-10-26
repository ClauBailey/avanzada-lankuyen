"use client";

import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

interface ConfirmSubmitButtonProps extends ButtonProps {
  message: string;
}

export function ConfirmSubmitButton({
  message,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <Button
      type="submit"
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      {...props}
    />
  );
}
