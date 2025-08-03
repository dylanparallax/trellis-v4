import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, Eye, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

export default function ObservationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Observations</h1>
          <p className="text-muted-foreground">
            View and manage classroom observations.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/observations/new">
            <Plus className="mr-2 h-4 w-4" />
            New Observation
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search observations..."
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        {observations.map((observation) => (
          <Card key={observation.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {observation.teacherName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{observation.teacherName}</CardTitle>
                    <CardDescription>{observation.subject} • Grade {observation.gradeLevel}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{observation.type}</div>
                  <div className="text-xs text-muted-foreground">{observation.date}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {observation.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {observation.duration} minutes
                  </div>
                </div>
                
                <div className="text-sm">
                  <p className="line-clamp-3 text-muted-foreground">
                    {observation.summary}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {observation.focusAreas.map((area) => (
                      <span
                        key={area}
                        className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                  
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/observations/${observation.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

const observations = [
  {
    id: '1',
    teacherName: 'Sarah Johnson',
    subject: 'Mathematics',
    gradeLevel: '5',
    type: 'Formal',
    date: 'Dec 15, 2024',
    duration: 45,
    summary: 'Excellent lesson on fractions with strong student engagement. Used manipulatives effectively and provided clear explanations. Students were actively participating in group work.',
    focusAreas: ['Student Engagement', 'Differentiation']
  },
  {
    id: '2',
    teacherName: 'Michael Chen',
    subject: 'Science',
    gradeLevel: '4',
    type: 'Informal',
    date: 'Dec 14, 2024',
    duration: 30,
    summary: 'Quick walkthrough during science experiment. Students were excited about the hands-on activity. Good classroom management during transitions.',
    focusAreas: ['Classroom Management']
  },
  {
    id: '3',
    teacherName: 'Emily Rodriguez',
    subject: 'English Language Arts',
    gradeLevel: '3',
    type: 'Formal',
    date: 'Dec 13, 2024',
    duration: 50,
    summary: 'Comprehensive reading lesson with excellent differentiation. Used various strategies to support different reading levels. Strong use of formative assessment.',
    focusAreas: ['Differentiation', 'Assessment']
  },
  {
    id: '4',
    teacherName: 'David Thompson',
    subject: 'Social Studies',
    gradeLevel: '5',
    type: 'Walkthrough',
    date: 'Dec 12, 2024',
    duration: 15,
    summary: 'Brief observation during group discussion. Students were engaged in historical analysis. Good use of primary sources.',
    focusAreas: ['Student Engagement']
  }
] 