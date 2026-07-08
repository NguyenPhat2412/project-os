"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

const ProgressValueContext = React.createContext<number | null>(null)

function Progress({
  className,
  value,
  children,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressValueContext.Provider value={value ?? null}>
      <ProgressPrimitive.Root
        value={value}
        data-slot="progress"
        className={cn("flex flex-wrap gap-3", className)}
        {...props}
      >
        {children}
        <ProgressTrack>
          <ProgressIndicator />
        </ProgressTrack>
      </ProgressPrimitive.Root>
    </ProgressValueContext.Provider>
  )
}

function ProgressTrack({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="progress-track"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  style,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Indicator>) {
  const value = React.useContext(ProgressValueContext)
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn("h-full bg-primary transition-all", className)}
      style={{ width: `${value ?? 0}%`, ...style }}
      {...props}
    />
  )
}

function ProgressLabel({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="progress-label"
      className={cn("text-sm font-medium", className)}
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="progress-value"
      className={cn("ml-auto text-sm text-muted-foreground tabular-nums", className)}
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
