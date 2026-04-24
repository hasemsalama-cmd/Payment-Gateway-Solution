import { useState } from "react"
import { Link } from "wouter"
import { format } from "date-fns"
import { Search, Loader2 } from "lucide-react"

import { useListApplications } from "@workspace/api-client-react"
import { ListApplicationsStatus } from "@workspace/api-zod"
import { formatCurrency } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, className: string }> = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
    approved: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200" },
    denied: { label: "Denied", className: "bg-red-100 text-red-800 border-red-200" },
    disbursed: { label: "Disbursed", className: "bg-blue-100 text-blue-800 border-blue-200" },
  }
  const mapped = map[status] || map.pending
  return <Badge variant="outline" className={mapped.className}>{mapped.label}</Badge>
}

function RecommendationBadge({ rec }: { rec: string }) {
  const map: Record<string, { label: string, className: string }> = {
    approve: { label: "Auto-Approve", className: "bg-green-100/50 text-green-800 border-green-200" },
    review: { label: "Manual Review", className: "bg-amber-100/50 text-amber-800 border-amber-200" },
    deny: { label: "High Risk", className: "bg-red-100/50 text-red-800 border-red-200" },
  }
  const mapped = map[rec] || map.review
  return <Badge variant="outline" className={mapped.className}>{mapped.label}</Badge>
}

export default function ApplicationsList() {
  const [statusFilter, setStatusFilter] = useState<ListApplicationsStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const { data: applications, isLoading } = useListApplications(
    { 
      status: statusFilter === "all" ? undefined : statusFilter,
      search: debouncedSearch || undefined
    }
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    const timeout = setTimeout(() => {
      setDebouncedSearch(e.target.value)
    }, 500)
    return () => clearTimeout(timeout)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">Applications</h1>
          <p className="text-muted-foreground mt-1">Review and manage loan requests.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or email..." 
            className="pl-9"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
            <SelectItem value="disbursed">Disbursed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : applications?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  No applications found.
                </TableCell>
              </TableRow>
            ) : (
              applications?.map((app) => (
                <TableRow key={app.id} className="group">
                  <TableCell>
                    <div className="font-medium">{app.fullName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{app.referenceCode}</div>
                  </TableCell>
                  <TableCell className="font-mono">{formatCurrency(app.amountRequested)}</TableCell>
                  <TableCell>{app.termMonths} mos</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium font-mono w-6">{app.score}</span>
                      <RecommendationBadge rec={app.recommendation} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={app.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(app.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/applications/${app.id}`}>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
