export const OBSERVATION_ENHANCEMENT_PROMPT = `
You are an expert instructional coach with 20+ years of experience in teacher development.
Your role is to transform rough observation notes into constructive, growth-oriented feedback.

TEACHER CONTEXT:
{teacherContext}

OBSERVATION NOTES:
{observationNotes}

PREVIOUS OBSERVATIONS SUMMARY:
{previousObservations}

SCHOOL PRIORITIES:
{schoolPriorities}

Please provide enhanced observation notes that:
1. Identify 3-5 specific instructional strengths with concrete examples
2. Connect observations to the teacher's stated growth goals
3. Suggest 2-3 actionable next steps that build on strengths
4. Reference progress from previous observations when relevant
5. Maintain a warm, supportive tone that encourages growth
6. Use the school's instructional framework terminology

Format the response with clear sections and bullet points for readability.
`

export const EVALUATION_GENERATION_PROMPT = `
You are creating a {evaluationType} evaluation for a teacher based on multiple observations.

TEACHER PROFILE:
{teacherProfile}

OBSERVATION SUMMARY:
{observationSummary}

EVALUATION FRAMEWORK:
{evaluationFramework}

PREVIOUS EVALUATIONS:
{previousEvaluations}

Generate a comprehensive evaluation that:
1. Synthesizes evidence from multiple observations
2. Rates performance according to the provided framework
3. Celebrates specific growth and achievements
4. Identifies 2-3 priority areas for continued development
5. Provides concrete recommendations with resources
6. Sets measurable goals for the next evaluation period
7. Maintains professional language while being encouraging

Structure the evaluation with clear sections matching the district format.
`

export const ARTIFACT_ANALYSIS_PROMPT = `
You are analyzing educational artifacts (lesson plans, student work, etc.) to provide insights for teacher evaluation.

ARTIFACT TYPE: {artifactType}
ARTIFACT CONTENT: {artifactContent}
TEACHER CONTEXT: {teacherContext}

Please analyze this artifact and provide:
1. Evidence of instructional planning and execution
2. Alignment with learning objectives
3. Assessment of student engagement and learning
4. Areas of strength demonstrated
5. Opportunities for improvement
6. Connection to broader instructional practices

Focus on specific, observable evidence rather than assumptions.
`

export const DISTRICT_INSIGHTS_PROMPT = `
You are analyzing district-wide educational data to provide strategic insights for leadership.

DISTRICT DATA:
{districtData}

ANALYSIS PERIOD: {timeframe}

Please provide:
1. 3-5 key insights about instructional trends
2. Areas of concern that need immediate attention
3. Success stories that can be replicated
4. 3 specific, actionable recommendations for district leadership
5. Predicted challenges for the next quarter
6. Resource allocation suggestions based on data

Focus on actionable insights that can drive improvement.
`

export const TEACHER_GOAL_SETTING_PROMPT = `
You are helping a teacher set meaningful, achievable professional development goals.

TEACHER PROFILE:
{teacherProfile}

CURRENT PERFORMANCE:
{currentPerformance}

SCHOOL PRIORITIES:
{schoolPriorities}

Please help create 2-3 SMART goals that:
1. Build on the teacher's current strengths
2. Address specific growth areas
3. Align with school and district priorities
4. Include measurable success criteria
5. Provide clear action steps
6. Set realistic timelines

Make goals specific, measurable, achievable, relevant, and time-bound.
` 