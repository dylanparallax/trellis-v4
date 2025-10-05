"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Wand2, FileText, Shield, TrendingUp, Zap, GraduationCap, BarChart3, Users, Lock, Heart, Database } from "lucide-react"

export function AnimatedTagline() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const taglines = [
    {
      text: "AI-powered Teacher Feedback",
      icon: <Wand2 className="mr-2 h-3 w-3" />,
      color: "bg-indigo-500/20 text-indigo-500",
    },
    {
      text: "AI-Enhanced Observations",
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
      text: "10+ hours saved per teacher",
      icon: <Zap className="mr-2 h-3 w-3" />,
      color: "bg-orange-500/20 text-orange-500",
    },
    {
      text: "Professional Development Focus",
      icon: <GraduationCap className="mr-2 h-3 w-3" />,
      color: "bg-teal-500/20 text-teal-500",
    },
   
    {
      text: "Institutional Memory",
      icon: <Users className="mr-2 h-3 w-3" />,
      color: "bg-cyan-500/20 text-cyan-500",
    },
    {
      text: "Enterprise-grade Security",
      icon: <Lock className="mr-2 h-3 w-3" />,
      color: "bg-red-500/20 text-red-500",
    },
    {
      text: "Teacher-focused Feedback",
      icon: <Heart className="mr-2 h-3 w-3" />,
      color: "bg-rose-500/20 text-rose-500",
    },
    {
      text: "Private & Secure Data",
      icon: <Database className="mr-2 h-3 w-3" />,
      color: "bg-emerald-500/20 text-emerald-500",
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


