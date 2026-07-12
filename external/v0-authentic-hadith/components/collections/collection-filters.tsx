"use client"

import { useState } from "react"
import { Filter, X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface CollectionFiltersProps {
  onFiltersChange: (filters: {
    grades: string[]
    scholars: string[]
    sort: string
  }) => void
  scholars: string[]
}

export function CollectionFilters({ onFiltersChange, scholars }: CollectionFiltersProps) {
  const [selectedGrades, setSelectedGrades] = useState<string[]>([])
  const [selectedScholars, setSelectedScholars] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("alphabetical")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const grades = [
    { id: "sahih", label: "Sahih", color: "bg-gradient-to-r from-[#C5A059] to-[#E8C77D]" },
    { id: "hasan", label: "Hasan", color: "bg-gradient-to-r from-[#1B5E43] to-[#2D7A5B]" },
    { id: "daif", label: "Da'if", color: "bg-gray-400" },
  ]

  const sortOptions = [
    { id: "alphabetical", label: "Alphabetical" },
    { id: "count", label: "Hadith Count" },
    { id: "grade", label: "Grade" },
  ]

  const handleGradeToggle = (gradeId: string) => {
    const newGrades = selectedGrades.includes(gradeId)
      ? selectedGrades.filter((g) => g !== gradeId)
      : [...selectedGrades, gradeId]
    setSelectedGrades(newGrades)
    onFiltersChange({ grades: newGrades, scholars: selectedScholars, sort: sortBy })
  }

  const handleScholarToggle = (scholar: string) => {
    const newScholars = selectedScholars.includes(scholar)
      ? selectedScholars.filter((s) => s !== scholar)
      : [...selectedScholars, scholar]
    setSelectedScholars(newScholars)
    onFiltersChange({ grades: selectedGrades, scholars: newScholars, sort: sortBy })
  }

  const handleSortChange = (sort: string) => {
    setSortBy(sort)
    onFiltersChange({ grades: selectedGrades, scholars: selectedScholars, sort })
  }

  const clearFilters = () => {
    setSelectedGrades([])
    setSelectedScholars([])
    setSortBy("alphabetical")
    onFiltersChange({ grades: [], scholars: [], sort: "alphabetical" })
  }

  const activeFilterCount = selectedGrades.length + selectedScholars.length

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Grade Filter */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Grade</h4>
        <div className="space-y-2">
          {grades.map((grade) => (
            <label key={grade.id} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  selectedGrades.includes(grade.id)
                    ? "border-[#C5A059] bg-gradient-to-r from-[#C5A059] to-[#E8C77D]"
                    : "border-border group-hover:border-[#C5A059]",
                )}
              >
                {selectedGrades.includes(grade.id) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-foreground">{grade.label}</span>
              <div className={cn("w-3 h-3 rounded-full ml-auto", grade.color)} />
            </label>
          ))}
        </div>
      </div>

      {/* Scholar Filter */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Scholar</h4>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {scholars.map((scholar) => (
            <label key={scholar} className="flex items-center gap-3 cursor-pointer group">
              <div
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                  selectedScholars.includes(scholar)
                    ? "border-[#C5A059] bg-gradient-to-r from-[#C5A059] to-[#E8C77D]"
                    : "border-border group-hover:border-[#C5A059]",
                )}
              >
                {selectedScholars.includes(scholar) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-foreground truncate">{scholar}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Sort By</h4>
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-sm appearance-none cursor-pointer focus:border-[#C5A059] focus:outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full py-2 rounded-lg border border-border text-sm text-muted-foreground hover:border-[#C5A059] hover:text-[#C5A059] transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-[240px] flex-shrink-0 sticky top-[80px] self-start">
        <div className="p-5 rounded-xl premium-card">
          <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#C5A059] to-[#E8C77D] text-white">
                {activeFilterCount}
              </span>
            )}
          </h3>
          <FilterContent />
        </div>
      </aside>

      {/* Mobile Filter Button */}
      <button
        onClick={() => setShowMobileFilters(true)}
        className="md:hidden fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full gold-button shadow-lg"
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-card/20">{activeFilterCount}</span>
        )}
      </button>

      {/* Mobile Filter Sheet */}
      {showMobileFilters && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Filters</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-8 h-8 rounded-full bg-[#ebe7e0] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <FilterContent />
            <button
              onClick={() => setShowMobileFilters(false)}
              className="w-full mt-6 py-3 rounded-xl emerald-button font-semibold"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </>
  )
}
