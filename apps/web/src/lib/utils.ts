import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 

/**
 * Normalizes markdown spacing for better readability in UI.
 * - Ensures blank lines between paragraphs
 * - Inserts a blank line after list blocks (ul/ol) and headings
 * - Promotes common section-like lines to headings when missing
 */
export function formatMarkdownForSpacing(input: string): string {
  const lines = input.split('\n')
  const listItemRegex = /^(\s*[-*+]\s+|\s*\d+\.\s+)/
  const headingRegex = /^(\s*#{1,6}\s+)/

  const knownSections = new Set([
    'Executive Summary',
    'Summary',
    'Strengths',
    'Areas for Growth',
    'Recommendations',
    'Next Steps',
    'Instructional Clarity and Structure',
    'Student Engagement and Classroom Culture',
    'Content Knowledge and Artistic Expertise',
    'Assessment and Feedback Culture',
    'Differentiated Learning Opportunities',
    'Learning Objectives',
    'Teaching Strategies',
    'Key Evidence',
    // Common observation section variants
    'Learning Environment',
    'Instructional Design & Delivery',
    'Instructional Design and Delivery',
    'Lesson Structure',
    'Questioning & Discussion',
    'Questioning and Discussion',
    'Student Engagement',
    'Classroom Management',
    'Areas of Strength',
    'Areas of Growth',
    'Growth Opportunities',
    'Overall Impact',
  ])

  const listPreferredSections = new Set([
    'Instructional Delivery',
    'Student Engagement',
    'Classroom Management',
    'Areas for Growth',
    'Areas of Growth',
    'Areas of Strength',
    'Growth Opportunities',
  ])

  const output: string[] = []
  let inListBlock = false
  let implicitListActive = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const isEmpty = line.trim().length === 0
    const isList = listItemRegex.test(line)
    const isHeading = headingRegex.test(line)
    const trimmed = line.trim()

    // Detect lines that look like headings but lack markdown hashes
    const normalizedCandidate = trimmed.replace(/:$/, '')
    const titleLikeRegex = /^[A-Z][A-Za-z0-9/&\-\s]+:?$/
    const looksLikeHeading =
      !isHeading && !isList && !isEmpty &&
      (
        knownSections.has(normalizedCandidate) ||
        (titleLikeRegex.test(trimmed) && trimmed.length <= 80 && !/[.!?]$/.test(trimmed))
      )

    if (looksLikeHeading) {
      const title = trimmed.replace(/:$/, '')
      if (output.length > 0 && output[output.length - 1].trim().length > 0) output.push('')
      output.push(`## ${title}`)
      output.push('')
      inListBlock = false
      // Some sections read better as lists; enable implicit list mode until a blank line
      implicitListActive = listPreferredSections.has(title)
      continue
    }

    // Determine if this line should be transformed into an implicit list item
    let isListLine = listItemRegex.test(line)
    let nextLineToPush = line

    // Activate implicit list mode after cue lines ending in a colon
    if (!isListLine && !isHeading && !isEmpty && /:\s*$/.test(trimmed)) {
      // Ensure a blank line before the list starts so markdown renders bullets
      if (output.length > 0 && output[output.length - 1].trim().length > 0) {
        output.push('')
      }
      implicitListActive = true
    } else if (implicitListActive && isEmpty) {
      // Blank line ends implicit list
      implicitListActive = false
    }

    if (implicitListActive && !isListLine && !isHeading && !isEmpty) {
      // Strip wrapping quotes for cleaner bullets
      const withoutQuotes = trimmed.replace(/^"(.+?)"$/g, '$1')
      nextLineToPush = `- ${withoutQuotes}`
      isListLine = true
    }

    // Push current (possibly transformed) line
    output.push(nextLineToPush)

    // Manage list block detection
    if (isListLine) {
      inListBlock = true
    } else if (!isListLine && inListBlock) {
      // We just ended a list block; ensure one blank line after it unless already present
      const prevOut = output[output.length - 1]
      if (prevOut && prevOut.trim().length > 0) {
        output.push('')
      }
      inListBlock = false
    }

    // Insert blank line between non-empty, non-list, non-heading consecutive lines
    if (!isEmpty && !isListLine && !isHeading) {
      const next = lines[i + 1] ?? ''
      const nextIsEmpty = next.trim().length === 0
      const nextIsList = listItemRegex.test(next)
      const nextIsHeading = headingRegex.test(next)
      if (!nextIsEmpty && !nextIsList && !nextIsHeading) {
        output.push('')
      }
    }
  }

  // Ensure single trailing newline style
  return output.join('\n').replace(/\n{3,}/g, '\n\n')
}