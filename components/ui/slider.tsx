"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

// Range slider (two thumbs). Value is always a [min, max] tuple.
function RangeSlider({
  className,
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenValues = 1,
}: {
  className?: string
  value: [number, number]
  onValueChange: (value: [number, number]) => void
  min?: number
  max?: number
  step?: number
  minStepsBetweenValues?: number
}) {
  return (
    <SliderPrimitive.Root
      value={value}
      onValueChange={(next) => onValueChange(next as [number, number])}
      min={min}
      max={max}
      step={step}
      minStepsBetweenValues={minStepsBetweenValues}
      className={cn("w-full", className)}
    >
      <SliderPrimitive.Control className="flex w-full touch-none items-center py-3 select-none">
        <SliderPrimitive.Track className="h-1.5 w-full rounded-full bg-muted">
          <SliderPrimitive.Indicator className="rounded-full bg-primary" />
          <SliderPrimitive.Thumb
            index={0}
            className="size-5 rounded-full border border-black/5 bg-white shadow-md outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-105"
          />
          <SliderPrimitive.Thumb
            index={1}
            className="size-5 rounded-full border border-black/5 bg-white shadow-md outline-none transition-transform focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-105"
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { RangeSlider }
