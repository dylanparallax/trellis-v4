import type { Teacher, Observation, Evaluation } from '@trellis/database'

export const mockTeachers: Teacher[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    subject: 'Mathematics',
    gradeLevel: '5',
    yearsOfExperience: 8,
    email: 'sarah.johnson@school.edu',
    phone: '(555) 123-4567',
    strengths: [
      'Classroom Management',
      'Differentiated Instruction',
      'Formative Assessment',
      'Student Engagement',
      'Parent Communication'
    ],
    growthAreas: [
      'Technology Integration',
      'Student-Led Discussions',
      'Higher-Order Thinking Questions'
    ],
    currentGoals: {
      '2024-2025': [
        'Integrate digital math tools in 50% of lessons',
        'Implement more collaborative problem-solving activities',
        'Develop student self-assessment strategies'
      ]
    },
    hireDate: new Date('2016-08-15'),
    schoolId: '1'
  },
  {
    id: '2',
    name: 'Michael Chen',
    subject: 'Science',
    gradeLevel: '4',
    yearsOfExperience: 5,
    email: 'michael.chen@school.edu',
    phone: '(555) 234-5678',
    strengths: [
      'Inquiry-Based Learning',
      'Student Collaboration',
      'Technology Integration',
      'Hands-On Activities',
      'Cross-Curricular Connections'
    ],
    growthAreas: [
      'Assessment Strategies',
      'Classroom Management',
      'Individual Student Support'
    ],
    currentGoals: {
      '2024-2025': [
        'Develop more comprehensive assessment rubrics',
        'Improve individual student support strategies',
        'Enhance classroom management techniques'
      ]
    },
    hireDate: new Date('2019-08-20'),
    schoolId: '1'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    subject: 'English Language Arts',
    gradeLevel: '3',
    yearsOfExperience: 12,
    email: 'emily.rodriguez@school.edu',
    phone: '(555) 345-6789',
    strengths: [
      'Literacy Instruction',
      'Reading Comprehension',
      'Formative Assessment',
      'Student Writing',
      'Cultural Responsiveness'
    ],
    growthAreas: [
      'Technology Integration',
      'Advanced Differentiation',
      'Data-Driven Instruction'
    ],
    currentGoals: {
      '2024-2025': [
        'Implement digital reading platforms',
        'Develop advanced differentiation strategies',
        'Enhance data analysis for instruction'
      ]
    },
    hireDate: new Date('2012-08-10'),
    schoolId: '1'
  }
]

export const mockObservations: Observation[] = [
  // Sarah Johnson observations
  {
    id: '1',
    teacherId: '1',
    observerId: 'admin1',
    date: new Date('2024-12-10'),
    duration: 45,
    type: 'FORMAL',
    rawNotes: 'Ms. Johnson began the lesson with a clear learning objective displayed on the board. Students were engaged in a hands-on fraction activity using manipulatives. She effectively circulated the room, providing individual support to struggling students. The lesson included good differentiation with extension activities for advanced learners.',
    enhancedNotes: 'Ms. Johnson demonstrated excellent lesson planning and execution. The learning objective was clearly communicated and students were actively engaged in hands-on fraction activities using manipulatives. Her classroom management was exemplary - she effectively circulated the room providing targeted support to individual students while maintaining overall classroom focus. The lesson showed strong differentiation with appropriate extension activities for advanced learners. Student engagement was high throughout the 45-minute period.',
    artifacts: [],
    aiEnhanced: true,
    createdAt: new Date('2024-12-10T10:00:00Z'),
    updatedAt: new Date('2024-12-10T10:00:00Z')
  },
  {
    id: '2',
    teacherId: '1',
    observerId: 'admin1',
    date: new Date('2024-11-15'),
    duration: 60,
    type: 'INFORMAL',
    rawNotes: 'Observed during math centers. Students were working in small groups on different activities. Ms. Johnson was working with a small group on multiplication strategies. Students seemed engaged and on-task.',
    enhancedNotes: 'During the math centers observation, Ms. Johnson demonstrated effective small group instruction. She was working with a targeted group on multiplication strategies while other students were appropriately engaged in independent center activities. The classroom environment was well-organized with clear expectations for center rotations. Students remained on-task throughout the observation period, indicating strong classroom management.',
    artifacts: [],
    aiEnhanced: true,
    createdAt: new Date('2024-11-15T14:30:00Z'),
    updatedAt: new Date('2024-11-15T14:30:00Z')
  },
  
  // Michael Chen observations
  {
    id: '3',
    teacherId: '2',
    observerId: 'admin1',
    date: new Date('2024-12-08'),
    duration: 50,
    type: 'FORMAL',
    rawNotes: 'Mr. Chen led an engaging science lesson on ecosystems. Students worked in groups to create food webs. He used technology effectively with an interactive whiteboard. Students were highly engaged and collaborative.',
    enhancedNotes: 'Mr. Chen delivered an outstanding science lesson on ecosystems that effectively integrated technology and collaborative learning. Students worked in well-structured groups to create food webs, demonstrating strong inquiry-based learning principles. The use of interactive whiteboard technology enhanced student engagement and understanding. The lesson showed excellent student collaboration with clear roles and responsibilities within groups. Mr. Chen provided appropriate scaffolding while allowing students to take ownership of their learning.',
    artifacts: [],
    aiEnhanced: true,
    createdAt: new Date('2024-12-08T09:15:00Z'),
    updatedAt: new Date('2024-12-08T09:15:00Z')
  },
  
  // Emily Rodriguez observations
  {
    id: '4',
    teacherId: '3',
    observerId: 'admin1',
    date: new Date('2024-12-12'),
    duration: 40,
    type: 'FORMAL',
    rawNotes: 'Ms. Rodriguez conducted a reading comprehension lesson using a shared reading approach. Students were actively participating in discussions about character development. She used effective questioning strategies to deepen understanding.',
    enhancedNotes: 'Ms. Rodriguez demonstrated exemplary literacy instruction through a well-structured shared reading lesson. Students were actively engaged in meaningful discussions about character development, showing strong reading comprehension skills. Her questioning strategies effectively promoted higher-order thinking and deeper understanding of the text. The lesson showed excellent differentiation with appropriate support for struggling readers while challenging advanced students. Student participation was high and responses demonstrated growing comprehension skills.',
    artifacts: [],
    aiEnhanced: true,
    createdAt: new Date('2024-12-12T11:00:00Z'),
    updatedAt: new Date('2024-12-12T11:00:00Z')
  }
]

export const mockEvaluations: Evaluation[] = [
  {
    id: '1',
    teacherId: '1',
    evaluatorId: 'admin1',
    type: 'FORMATIVE',
    date: new Date('2024-06-15'),
    summary: 'Strong performance in classroom management and differentiated instruction. Areas for growth in technology integration.',
    content: 'Comprehensive formative evaluation focusing on instructional practices and student engagement.',
    rating: 3.8,
    schoolYear: '2023-2024',
    createdAt: new Date('2024-06-15T14:00:00Z'),
    updatedAt: new Date('2024-06-15T14:00:00Z')
  },
  {
    id: '2',
    teacherId: '2',
    evaluatorId: 'admin1',
    type: 'SUMMATIVE',
    date: new Date('2024-05-20'),
    summary: 'Excellent inquiry-based learning and student collaboration. Demonstrated strong growth in technology integration.',
    content: 'Comprehensive summative evaluation highlighting strengths in inquiry-based instruction.',
    rating: 4.2,
    schoolYear: '2023-2024',
    createdAt: new Date('2024-05-20T10:30:00Z'),
    updatedAt: new Date('2024-05-20T10:30:00Z')
  }
]

export function getTeacherById(id: string): Teacher | undefined {
  return mockTeachers.find(teacher => teacher.id === id)
}

export function getObservationsByTeacherId(teacherId: string): Observation[] {
  return mockObservations.filter(obs => obs.teacherId === teacherId)
}

export function getEvaluationsByTeacherId(teacherId: string): Evaluation[] {
  return mockEvaluations.filter(evaluation => evaluation.teacherId === teacherId)
} 