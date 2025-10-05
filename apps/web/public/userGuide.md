# **Trellis Beta Test User Guide**

* **Audience**: Principals, coaches, and evaluators piloting Trellis AI  
* **Goal**: Capture observations, generate high‑quality feedback, and manage teachers—fast.

## **Getting Started**

* **Sign in**: Go to the login page and enter your credentials.  
* If you see an empty dashboard, add teachers first or import via CSV.

### **Navigation**

* **Sidebar (left)**: Dashboard, Teachers, Observations, Feedback, Settings.  
* **Top bar**: Search field (basic), mobile menu, school badge.  
* **Profile menu**: Open from the bottom of the sidebar to access Account Settings or Log Out.  
* Mobile: Tap the menu icon to open navigation.

### **Dashboard**

* **KPI cards**: Total Teachers, Observations This Month, Feedback Drafts, Performance Score.  
* **Recent Observations**: Quick list linking to teacher profiles.  
* **Quick Actions**:  
  * Start Observation → `/dashboard/observations/new`  
  * New Feedback → `/dashboard/evaluations/new`  
  * Manage Teachers → `/dashboard/teachers`  
* **AI Insights**: Simple trend summaries over 30/60/90 days with a timeframe selector.

### **Teachers**

* **Teachers list**: Grid or table view with search and filters (subject, grade, tags).  
* **Add Teacher**: Use the “Add Teacher” button to create a profile.  
* **Import CSV**: Click “Import CSV” to bulk‑add teachers.  
  * Template fields: name, email, subject, gradeLevel, strengths, growthAreas.  
  * Use semicolons for multi‑value tags (e.g., “Classroom Management;Technology”).  
* **Cards**: Show strengths, growth areas, goals, and recent activity. Click a teacher to view details.

### **Observations**

* **List**: Shows all observations; click to view a detail page.  
* **New Observation**: Guided form to capture:  
  * Teacher, date/time, duration, type, focus areas, and notes.  
  * Notes support AI enhancement downstream (shown on the detail page if available).  
* **Observation Detail**:  
  * Summary metadata (date, duration, observer).  
  * Focus areas, raw and enhanced notes.  
  * Use this view to review observation artifacts.

### **Feedback**

* **List**: All feedback with statuses (Draft, Submitted, etc.).  
* **New Feedback**:  
  * Select a teacher (searchable list).  
  * Choose feedback type (Formative or Summative) and school year.  
  * Click “Generate Feedback” to open the AI chat workspace.  
* **AI Chat Workspace**:  
  * Left: Chat with Trellis to refine the feedback (ask for rewrites, add examples, adjust tone).  
  * Right: Generated Feedback panel with version tabs (V1, V2, …).  
  * Actions: Copy or Download the current version.  
  * When ready, click “Save Feedback” to save a draft (status: DRAFT).  
  * After saving, click “Submit to Teacher” to deliver it to the teacher (status: SUBMITTED).

### **Settings**

* **Profile**: Update display name, photo, and (placeholder) password field.  
  * Photo uploads save immediately and update your avatar.  
* **Feedback Framework (text)**: Paste rubric/framework text to inform generation.  
* **AI Tone & Guidelines**: Define tone, structure, and preferences to shape outputs.  
* **Export Data**: Download all your data (`trellis-export.json`).

### **Exporting and Data**

* Use Settings → Export data to download a JSON export.  
* Teacher import/export: Use the CSV importer on the Teachers page.

## **Tips for Best Results**

* **Before generating**: Add teachers and a framework; set AI guidelines (tone, structure, examples).  
* **In chat**: Be specific—ask for “2 actionable next steps” or “tighten to 150 words.”  
* **Versioning**: Each meaningful change creates a new version; pick the best before submitting.

## **Known Limits (beta)**

* Search is basic; analytics link may be limited or disabled in your build.  
* Performance score averages depend on available feedback data.  
* Ensure network connectivity for AI generation and file uploads.

### **Privacy & Pilot Etiquette**

* Avoid real student PII during beta (use initials only)  
* Keep feedback constructive; flag odd outputs with a brief description and screenshot.

### **How to Share Feedback**

* Report issues and suggestions to your pilot coordinator with steps, browser, and screenshots.  
* If possible, attach exported JSON or the copied feedback text to help reproduce.
