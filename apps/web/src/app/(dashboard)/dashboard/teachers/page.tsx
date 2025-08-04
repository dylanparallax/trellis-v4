import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'

export default function TeachersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground">
            Manage teacher profiles and performance tracking.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teachers/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search teachers..."
                          className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teachers.map((teacher) => (
          <Card key={teacher.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-medium text-primary">
                    {teacher.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{teacher.name}</CardTitle>
                  <CardDescription>{teacher.subject} • Grade {teacher.gradeLevel}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Observations</span>
                  <span className="font-medium">{teacher.observations}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Performance</span>
                  <span className="font-medium">{teacher.performance}/5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium ${
                    teacher.status === 'Active' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {teacher.status}
                  </span>
                </div>
                
                <div className="pt-2 space-y-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/teachers/${teacher.id}`}>
                      View Profile
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/observations/new?teacher=${teacher.id}`}>
                      Start Observation
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

const teachers = [
  {
    id: '1',
    name: 'Sarah Johnson',
    subject: 'Mathematics',
    gradeLevel: '5',
    observations: 12,
    performance: 4.2,
    status: 'Active'
  },
  {
    id: '2',
    name: 'Michael Chen',
    subject: 'Science',
    gradeLevel: '4',
    observations: 8,
    performance: 4.5,
    status: 'Active'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    subject: 'English Language Arts',
    gradeLevel: '3',
    observations: 15,
    performance: 3.8,
    status: 'Active'
  },
  {
    id: '4',
    name: 'David Thompson',
    subject: 'Social Studies',
    gradeLevel: '5',
    observations: 6,
    performance: 4.0,
    status: 'Active'
  },
  {
    id: '5',
    name: 'Lisa Wang',
    subject: 'Special Education',
    gradeLevel: 'K-2',
    observations: 10,
    performance: 4.3,
    status: 'Active'
  },
  {
    id: '6',
    name: 'Robert Martinez',
    subject: 'Physical Education',
    gradeLevel: 'K-5',
    observations: 4,
    performance: 3.9,
    status: 'Active'
  }
] 