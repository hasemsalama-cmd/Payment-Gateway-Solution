import { useGetDashboardSummary, useGetRecentActivity, useGetRiskDistribution, useGetMonthlyVolume } from "@workspace/api-client-react"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, PieChart, Pie, Cell } from "recharts"
import { Loader2, TrendingUp, AlertTriangle, CheckCircle, FileText, DollarSign, Activity } from "lucide-react"

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary()
  const { data: activity, isLoading: loadingActivity } = useGetRecentActivity()
  const { data: risk, isLoading: loadingRisk } = useGetRiskDistribution()
  const { data: volume, isLoading: loadingVolume } = useGetMonthlyVolume()

  if (loadingSummary || loadingActivity || loadingRisk || loadingVolume) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  if (!summary) return null

  const COLORS = ['hsl(165 40% 30%)', 'hsl(220 30% 40%)', 'hsl(40 60% 50%)', 'hsl(0 40% 50%)']

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1">Command center for your lending operations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Apps</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{summary.pendingApplications}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Loans</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{summary.activeLoans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Outstanding Principal</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{formatCurrency(summary.outstandingPrincipal)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Default Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">{formatPercent(summary.defaultRate)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="font-serif">Monthly Volume</CardTitle>
            <CardDescription>Disbursements vs Collections over the last 6 months.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {volume && volume.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volume}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', color: 'hsl(var(--popover-foreground))' }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="disbursed" name="Disbursed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No volume data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="font-serif">Risk Distribution</CardTitle>
            <CardDescription>Breakdown of application scores.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             {risk && risk.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={risk}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="label"
                  >
                    {risk.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No risk data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="font-serif">Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Approval Rate</p>
                <p className="text-3xl font-mono">{formatPercent(summary.approvalRate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Average Loan Size</p>
                <p className="text-3xl font-mono">{formatCurrency(summary.averageLoanSize)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Total Disbursed</p>
                <p className="text-3xl font-mono">{formatCurrency(summary.totalDisbursed)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Total Collected</p>
                <p className="text-3xl font-mono">{formatCurrency(summary.totalCollected)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="font-serif">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activity?.map((event) => (
                <div key={event.id} className="flex gap-4 items-start">
                  <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {event.type === 'application_submitted' && <FileText className="h-4 w-4 text-muted-foreground" />}
                    {event.type === 'application_approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {event.type === 'application_denied' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    {event.type === 'loan_disbursed' && <TrendingUp className="h-4 w-4 text-primary" />}
                    {event.type === 'payment_received' && <DollarSign className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="leading-none text-foreground font-medium">{event.message}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(event.occurredAt), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              ))}
              {(!activity || activity.length === 0) && (
                 <div className="text-sm text-muted-foreground">No recent activity.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
