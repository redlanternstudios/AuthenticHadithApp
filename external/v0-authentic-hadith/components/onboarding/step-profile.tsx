"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Camera, User, ChevronDown, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const SCHOOLS_OF_THOUGHT = ["Hanafi", "Maliki", "Shafi'i", "Hanbali", "Other / Prefer not to say"]

interface StepProfileProps {
  data: {
    name: string
    avatarUrl: string | null
    avatarFile: File | null
    schoolOfThought: string
  }
  onUpdate: (data: Partial<StepProfileProps["data"]>) => void
}

export function StepProfile({ data, onUpdate }: StepProfileProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateName = (value: string) => {
    if (value.length < 2) {
      setNameError("Name must be at least 2 characters")
      return false
    }
    if (!/^[a-zA-Z\s\-']+$/.test(value)) {
      setNameError("Please enter a valid name (letters and spaces only)")
      return false
    }
    setNameError(null)
    return true
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value.length <= 50) {
      onUpdate({ name: value })
      if (value.length > 0) {
        validateName(value)
      } else {
        setNameError(null)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Image must be less than 5MB")
        return
      }
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        alert("Please upload a JPG or PNG image")
        return
      }
      const url = URL.createObjectURL(file)
      onUpdate({ avatarUrl: url, avatarFile: file })
    }
  }

  const handleRemoveAvatar = () => {
    onUpdate({ avatarUrl: null, avatarFile: null })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-8 max-h-[65vh] overflow-y-auto pr-1 -mr-1">
      {/* Heading */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">{"Welcome! Let's set up your profile"}</h2>
        <p className="text-muted-foreground">Tell us a bit about yourself to personalize your experience</p>
      </div>

      {/* Avatar Upload */}
      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "relative w-[120px] h-[120px] rounded-full cursor-pointer group",
            "border-2 border-dashed transition-all duration-200",
            data.avatarUrl ? "border-[#C5A059]" : "border-[#C5A059] hover:border-[#E8C77D]",
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          {data.avatarUrl ? (
            <>
              <img
                src={data.avatarUrl || "/placeholder.svg"}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center group-hover:bg-[#ebe7e0] transition-colors">
              <User className="w-12 h-12 text-[#C5A059]" />
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/20">
                <Camera className="w-8 h-8 text-white" />
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload profile picture"
          />
        </div>
        {data.avatarUrl && (
          <button
            type="button"
            onClick={handleRemoveAvatar}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Remove photo
          </button>
        )}
        <p className="text-xs text-muted-foreground">Click to upload (JPG/PNG, max 5MB)</p>
      </div>

      {/* Name Input */}
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Your Name <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={data.name}
            onChange={handleNameChange}
            className={cn("h-12 premium-input rounded-lg", nameError && "border-destructive focus:border-destructive")}
            maxLength={50}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {data.name.length}/50
          </span>
        </div>
        {nameError && <p className="text-sm text-destructive">{nameError}</p>}
      </div>

      {/* School of Thought Dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">School of Thought (Madhab)</label>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              "w-full h-12 px-4 flex items-center justify-between",
              "premium-input rounded-lg text-left transition-all",
              dropdownOpen && "border-[#C5A059] ring-2 ring-[#C5A059]/20",
            )}
          >
            <span className={data.schoolOfThought ? "text-foreground" : "text-muted-foreground"}>
              {data.schoolOfThought || "Select your school of thought"}
            </span>
            <ChevronDown
              className={cn("w-4 h-4 text-muted-foreground transition-transform", dropdownOpen && "rotate-180")}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 w-full mt-2 bg-card border border-border rounded-lg shadow-lg overflow-y-auto max-h-60">
              {SCHOOLS_OF_THOUGHT.map((school) => (
                <button
                  key={school}
                  type="button"
                  onClick={() => {
                    onUpdate({ schoolOfThought: school })
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left flex items-center justify-between",
                    "hover:bg-muted transition-colors",
                    data.schoolOfThought === school && "bg-muted",
                  )}
                >
                  <span className="text-foreground">{school}</span>
                  {data.schoolOfThought === school && <Check className="w-4 h-4 text-[#C5A059]" />}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Optional</p>
      </div>
    </div>
  )
}
