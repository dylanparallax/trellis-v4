// COMPLETE OBSERVATIONS TRANSFORMATION SCRIPT
// Copy this code and run it in a JavaScript environment with access to your CSV files

import Papa from 'papaparse';

const knownTeachers = [
  { name: "Sheldon Cooper", email: "SheldonCooper@sitcomhighschool.com" },
  { name: "Leslie Knope", email: "LeslieKnope@sitcomhighschool.com" },
  { name: "Tobias Fünke", email: "TobiasFünke@sitcomhighschool.com" },
  { name: "Tyrion Lannister", email: "TyrionLannister@sitcomhighschool.com" },
  { name: "Rachel Green", email: "RachelGreen@sitcomhighschool.com" },
  { name: "Dwight Schrute", email: "DwightSchrute@sitcomhighschool.com" },
  { name: "Jim Halpert", email: "JimHalpert@sitcomhighschool.com" },
  { name: "Pam Beesly", email: "PamBeesly@sitcomhighschool.com" },
  { name: "Michael Scott", email: "MichaelScott@sitcomhighschool.com" }
];

function findTeacherFromNotes(rawNotes, enhancedNotes) {
  const allNotes = ((rawNotes || '') + ' ' + (enhancedNotes || '')).toLowerCase();
  
  // Try full names first (most reliable)
  for (const teacher of knownTeachers) {
    if (allNotes.includes(teacher.name.toLowerCase())) {
      return teacher;
    }
  }
  
  // Try first names (less reliable but covers more cases)
  for (const teacher of knownTeachers) {
    const firstName = teacher.name.split(' ')[0].toLowerCase();
    // Make sure it's a word boundary to avoid false matches
    const regex = new RegExp(`\\b${firstName}\\b`, 'i');
    if (regex.test(allNotes)) {
      return teacher;
    }
  }
  
  // Handle common variations and nicknames
  const variations = {
    'funke': 'Tobias Fünke',
    'tobias funke': 'Tobias Fünke',
    'dwigth': 'Dwight Schrute',
    'mike': 'Michael Scott',
    'mike scott': 'Michael Scott'
  };
  
  for (const [variation, correctName] of Object.entries(variations)) {
    if (allNotes.includes(variation)) {
      return knownTeachers.find(t => t.name === correctName);
    }
  }
  
  return null;
}

async function transformObservations() {
  try {
    // Load the observations file
    const observationsData = await window.fs.readFile('observations_rows.csv', { encoding: 'utf8' });
    
    // Parse CSV
    const parsed = Papa.parse(observationsData, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });
    
    console.log(`Processing ${parsed.data.length} observations...`);
    
    // Transform each observation
    let matchCount = 0;
    let noMatchCount = 0;
    const transformedData = [];
    
    parsed.data.forEach((obs, index) => {
      const teacher = findTeacherFromNotes(obs.raw_notes, obs.enhanced_notes);
      
      if (teacher) {
        matchCount++;
      } else {
        noMatchCount++;
        // Log unmatched for review
        console.log(`No match #${noMatchCount}: ${obs.raw_notes ? obs.raw_notes.slice(0, 60) : 'No notes'}...`);
      }
      
      transformedData.push({
        teacherEmail: teacher ? teacher.email : '',
        teacherName: teacher ? teacher.name : 'Unknown Teacher',
        date: obs.date || '',
        observationType: obs.type || '',
        duration: '', // Not available in source
        focusAreas: obs.standards_tagged || '',
        rawNotes: obs.raw_notes || ''
      });
    });
    
    // Generate final CSV
    const outputCSV = Papa.unparse(transformedData);
    
    // Show results
    console.log(`\n=== TRANSFORMATION COMPLETE ===`);
    console.log(`✅ Successfully matched: ${matchCount} observations`);
    console.log(`❌ No teacher match: ${noMatchCount} observations`);
    console.log(`📊 Total processed: ${transformedData.length} observations`);
    
    // Return the CSV string
    return outputCSV;
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Run the transformation
const transformedCSV = await transformObservations();

// The transformedCSV variable now contains your complete transformed data
console.log('Transformation complete! Use the transformedCSV variable or copy the output above.');