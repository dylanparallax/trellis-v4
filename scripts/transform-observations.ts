import { readFile, writeFile } from 'node:fs/promises'
import Papa from 'papaparse'

const knownTeachers = [
  { name: 'Sheldon Cooper', email: 'SheldonCooper@sitcomhighschool.com' },
  { name: 'Leslie Knope', email: 'LeslieKnope@sitcomhighschool.com' },
  { name: 'Tobias Fünke', email: 'TobiasFünke@sitcomhighschool.com' },
  { name: 'Tyrion Lannister', email: 'TyrionLannister@sitcomhighschool.com' },
  { name: 'Rachel Green', email: 'RachelGreen@sitcomhighschool.com' },
  { name: 'Dwight Schrute', email: 'DwightSchrute@sitcomhighschool.com' },
  { name: 'Jim Halpert', email: 'JimHalpert@sitcomhighschool.com' },
  { name: 'Pam Beesly', email: 'PamBeesly@sitcomhighschool.com' },
  { name: 'Michael Scott', email: 'MichaelScott@sitcomhighschool.com' },
]

function findTeacherFromNotes(rawNotes?: string, enhancedNotes?: string) {
  const allNotes = `${rawNotes || ''} ${enhancedNotes || ''}`.toLowerCase()

  for (const teacher of knownTeachers) {
    if (allNotes.includes(teacher.name.toLowerCase())) return teacher
  }

  for (const teacher of knownTeachers) {
    const firstName = teacher.name.split(' ')[0].toLowerCase()
    const regex = new RegExp(`\\b${firstName}\\b`, 'i')
    if (regex.test(allNotes)) return teacher
  }

  const variations: Record<string, string> = {
    funke: 'Tobias Fünke',
    'tobias funke': 'Tobias Fünke',
    dwigth: 'Dwight Schrute',
    mike: 'Michael Scott',
    'mike scott': 'Michael Scott',
  }

  for (const [variation, correctName] of Object.entries(variations)) {
    if (allNotes.includes(variation)) {
      return knownTeachers.find((t) => t.name === correctName) || null
    }
  }

  return null
}

async function transformObservations(inputPath = 'observations_rows.csv', outputPath = 'observations_transformed.csv') {
  const observationsData = await readFile(inputPath, 'utf8')
  const parsed = Papa.parse(observationsData, { header: true, skipEmptyLines: true, dynamicTyping: true })

  let matchCount = 0
  let noMatchCount = 0
  const transformedData: Array<Record<string, string>> = []

  ;(parsed.data as any[]).forEach((obs, index) => {
    const teacher = findTeacherFromNotes(obs.raw_notes, obs.enhanced_notes)
    if (teacher) matchCount++
    else {
      noMatchCount++
      // eslint-disable-next-line no-console
      console.log(`No match #${noMatchCount}: ${obs.raw_notes ? String(obs.raw_notes).slice(0, 60) : 'No notes'}...`)
    }

    transformedData.push({
      teacherEmail: teacher ? teacher.email : '',
      teacherName: teacher ? teacher.name : 'Unknown Teacher',
      date: obs.date || '',
      observationType: obs.type || '',
      duration: '',
      focusAreas: obs.standards_tagged || '',
      rawNotes: obs.raw_notes || '',
    })
  })

  const outputCSV = Papa.unparse(transformedData)
  await writeFile(outputPath, outputCSV, 'utf8')

  // eslint-disable-next-line no-console
  console.log(`\n=== TRANSFORMATION COMPLETE ===`)
  // eslint-disable-next-line no-console
  console.log(`✅ Successfully matched: ${matchCount} observations`)
  // eslint-disable-next-line no-console
  console.log(`❌ No teacher match: ${noMatchCount} observations`)
  // eslint-disable-next-line no-console
  console.log(`📊 Total processed: ${transformedData.length} observations`)
  // eslint-disable-next-line no-console
  console.log(`📄 Wrote output CSV to: ${outputPath}`)
}

// If executed directly
// eslint-disable-next-line unicorn/prefer-module
if (require.main === module) {
  const [,, inArg, outArg] = process.argv
  transformObservations(inArg || 'observations_rows.csv', outArg || 'observations_transformed.csv').catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
