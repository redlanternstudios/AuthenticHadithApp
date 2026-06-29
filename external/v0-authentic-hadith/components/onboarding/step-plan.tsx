"use client"

import { Crown, Check, Star, Sparkles, BookOpen } from "lucide-react"
import { PRODUCTS, type Product } from "@/lib/products"
import { cn } from "@/lib/utils"

interface StepPlanProps {
  selectedPlanId: string | null
  onSelect: (planId: string | null) => void
}

function formatPrice(cents: number, interval?: string) {
  const dollars = (cents / 100).toFixed(2).replace(/\.00$/, "")
  if (interval === "month") return `$${dollars}/mo`
  if (interval === "year") return `$${dollars}/yr`
  return `$${dollars}`
}

const TIER_ICONS: Record<string, typeof Crown> = {
  "monthly-premium": Star,
  "annual-premium": Crown,
  "lifetime-access": Sparkles,
}

export function StepPlan({ selectedPlanId, onSelect }: StepPlanProps) {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full gold-icon-bg flex items-center justify-center">
            <Crown className="w-8 h-8 text-[#C5A059]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground text-sm">
          Start free as an Explorer or unlock deeper study with Pro. Change anytime.
        </p>
      </div>

      {/* Explorer (Free) Option */}
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-left",
          selectedPlanId === null
            ? "border-[#1B5E43] bg-[#1B5E43]/5"
            : "border-border hover:border-muted-foreground/40"
        )}
      >
        <div className={cn(
          "w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all",
          selectedPlanId === null ? "border-[#1B5E43] bg-[#1B5E43]" : "border-muted-foreground/40"
        )}>
          {selectedPlanId === null && (
            <Check className="w-3 h-3 text-white" />
          )}
        </div>
        <div className="flex items-center gap-2 flex-1">
          <BookOpen className="w-4 h-4 text-[#1B5E43] dark:text-[#6bb895] shrink-0" />
          <div>
            <div className="font-semibold text-foreground">Explorer</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse all collections, basic search, 3 AI/day, 40 saves, 1 quiz/day
            </p>
          </div>
        </div>
        <span className="text-sm font-bold text-[#1B5E43] dark:text-[#6bb895]">Free</span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upgrade for depth</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Paid Plans */}
      <div className="space-y-3">
        {PRODUCTS.map((product) => {
          const isSelected = selectedPlanId === product.id
          const IconComponent = TIER_ICONS[product.id] || Star
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product.id)}
              className={cn(
                "w-full flex items-start gap-4 p-4 rounded-lg border-2 transition-all text-left relative overflow-hidden",
                isSelected
                  ? "border-[#C5A059] bg-[#C5A059]/5"
                  : "border-border hover:border-[#C5A059]/40",
                product.highlighted && !isSelected && "border-[#C5A059]/30"
              )}
            >
              {/* Badge */}
              {product.badge && (
                <div className="absolute top-0 right-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#C5A059] text-white rounded-bl-lg">
                  {product.badge}
                </div>
              )}

              {/* Radio indicator */}
              <div className={cn(
                "w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 mt-0.5 transition-all",
                isSelected ? "border-[#C5A059] bg-[#C5A059]" : "border-muted-foreground/40"
              )}>
                {isSelected && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4 text-[#C5A059]" />
                  <span className="font-semibold text-foreground text-sm">{product.tierLabel} -- {product.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                {/* Key features preview */}
                {product.features && product.features.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {product.features.slice(0, 3).map((feature, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-foreground text-sm">
                  {formatPrice(product.priceInCents, product.interval)}
                </div>
                {product.trialDays && (
                  <div className="text-[10px] text-[#1B5E43] font-medium mt-0.5">
                    {product.trialDays}-day free trial
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Fine print */}
      <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
        You can cancel anytime from your profile settings or device subscription manager.
        No charge until your free trial ends.
      </p>
    </div>
  )
}
