import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportGenerator } from '@/components/reports/ReportGenerator';
import { StatsChart } from '@/components/dashboard/StatsChart';
import { useRealtimeStats } from '@/hooks/useRealtimeStats';
import { BarChart, FileText, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Reports() {
  const { stats, loading } = useRealtimeStats();

  const quickStats = [
    {
      title: "Total Collection",
      value: loading ? "..." : stats.totalBooks.toLocaleString(),
      description: "Books in library",
      trend: "+5.2%",
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Active Circulation",
      value: loading ? "..." : stats.booksIssued.toLocaleString(),
      description: "Currently issued",
      trend: "-2.1%",
      color: "bg-accent/10 text-accent"
    },
    {
      title: "Member Base",
      value: loading ? "..." : stats.activeMembers.toLocaleString(),
      description: "Active members",
      trend: "+8.7%",
      color: "bg-success/10 text-success"
    },
    {
      title: "Outstanding Fines",
      value: loading ? "..." : `$${stats.totalFines.toFixed(2)}`,
      description: "Pending collection",
      trend: "+12.3%",
      color: "bg-warning/10 text-warning"
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive reporting and analytics for library operations and performance.
        </p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Card key={stat.title} className="hover-lift transition-smooth">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <Badge variant="secondary" className="text-xs">
                      {stat.trend}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <BarChart className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator" className="flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            Report Generator
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Analytics Dashboard
          </TabsTrigger>
          <TabsTrigger value="exports" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Quick Exports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <ReportGenerator />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <StatsChart data={stats} />
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Collection Utilization</span>
                    <span className="text-sm text-muted-foreground">
                      {loading ? "..." : Math.round((stats.booksIssued / stats.totalBooks) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ 
                        width: loading ? "0%" : `${Math.min(100, (stats.booksIssued / stats.totalBooks) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Overdue Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {loading ? "..." : Math.round((stats.overdueBooks / Math.max(1, stats.booksIssued)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-destructive rounded-full h-2 transition-all"
                      style={{ 
                        width: loading ? "0%" : `${Math.min(100, (stats.overdueBooks / Math.max(1, stats.booksIssued)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Reservations</span>
                    <span className="text-sm text-muted-foreground">
                      {loading ? "..." : stats.totalReservations}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-accent rounded-full h-2 transition-all"
                      style={{ 
                        width: loading ? "0%" : `${Math.min(100, (stats.totalReservations / Math.max(1, stats.activeMembers)) * 50)}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {loading ? "..." : Math.round(stats.totalBooks / Math.max(1, stats.activeMembers))}
                      </p>
                      <p className="text-xs text-muted-foreground">Books per Member</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-accent">
                        {loading ? "..." : Math.round((stats.booksIssued / Math.max(1, stats.activeMembers)) * 100) / 100}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg. Issues per Member</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exports" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Complete monthly report including all transactions, new members, and financial summary.
                </p>
                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Monthly Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Overdue Books</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  List of all overdue books with member contact information for follow-up.
                </p>
                <Button className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Overdue List
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Member Directory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Complete member directory with contact details and membership status.
                </p>
                <Button className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Member List
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Financial Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Detailed financial breakdown including fines collected and outstanding amounts.
                </p>
                <Button className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Financial Report
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Book Catalog</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Complete book inventory with availability status and category breakdown.
                </p>
                <Button className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Book Catalog
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Library usage patterns, popular books, and member activity analytics.
                </p>
                <Button className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Usage Stats
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}