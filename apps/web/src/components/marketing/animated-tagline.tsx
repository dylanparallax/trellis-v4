"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Wand2, FileText, Shield, TrendingUp, Zap, GraduationCap, BarChart3, Users } from "lucide-react"

export function AnimatedTagline() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const taglines = [
    {
      text: "AI-powered Teacher Evaluations",
      icon: <Wand2 className="mr-2 h-3 w-3" />,
      color: "bg-indigo-500/20 text-indigo-500",
    },
    {
      text: "Enhanced Observation Notes",
      icon: <FileText className="mr-2 h-3 w-3" />,
      color: "bg-blue-500/20 text-blue-500",
    },
    {
      text: "District-wide Standards Applied",
      icon: <Shield className="mr-2 h-3 w-3" />,
      color: "bg-green-500/20 text-green-500",
    },
    {
      text: "Growth Tracking & Analytics",
      icon: <TrendingUp className="mr-2 h-3 w-3" />,
      color: "bg-purple-500/20 text-purple-500",
    },
    {
      text: "80% Time Savings",
      icon: <Zap className="mr-2 h-3 w-3" />,
      color: "bg-orange-500/20 text-orange-500",
    },
    {
      text: "Professional Development Focus",
      icon: <GraduationCap className="mr-2 h-3 w-3" />,
      color: "bg-teal-500/20 text-teal-500",
    },
    {
      text: "Comprehensive 8-12 Page Reports",
      icon: <BarChart3 className="mr-2 h-3 w-3" />,
      color: "bg-pink-500/20 text-pink-500",
    },
    {
      text: "Institutional Memory",
      icon: <Users className="mr-2 h-3 w-3" />,
      color: "bg-cyan-500/20 text-cyan-500",
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false)
      const timeout = setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % taglines.length)
        setIsVisible(true)
      }, 500)
      return () => clearTimeout(timeout)
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  const currentTagline = taglines[currentIndex]

  return (
    <Badge
      variant="secondary"
      className={`mb-6 transition-all duration-700 ${currentTagline.color} ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      {currentTagline.icon}
      {currentTagline.text}
    </Badge>
  )
}


