"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface MobileCardViewProps<T> {
  data: T[]
  renderCard: (item: T, index: number) => React.ReactNode
  onCardClick?: (item: T, index: number) => void
  className?: string
  emptyMessage?: string
}

export function MobileCardView<T>({
  data,
  renderCard,
  onCardClick,
  className,
  emptyMessage = "No records found",
}: MobileCardViewProps<T>) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => (
        <Card
          key={index}
          className={cn(
            "transition-colors",
            onCardClick && "cursor-pointer hover:bg-accent"
          )}
          onClick={() => onCardClick?.(item, index)}
        >
          <CardContent className="p-4">{renderCard(item, index)}</CardContent>
        </Card>
      ))}
    </div>
  )
}
