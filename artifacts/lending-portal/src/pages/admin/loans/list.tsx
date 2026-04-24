import { useState } from "react"
import { Link } from "wouter"
import { format } from "date-fns"
import { Search, Loader2 } from "lucide-react"

import { useListLoans } from "@workspace/api-client-react"
import { ListLoansStatus } from "@workspace/api-zod"
import { formatCurrency } from "@/lib/utils"

import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

function LoanStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, className: string }> = {
    active: { label: "Active", className: "bg-blue-100 text-blue-800 border-blue-200" },
    paid: { label: "Paid in Full", className: "bg-green-100 text-green-800 border-green-200" },
    defaulted: { label: "Defaulted", className: "bg-red-100 text-red-800 border-red-200" },
  }
  const mapped = map[status] || map.active
  return <Badge variant="outline" className={mapped.className}>{mapped.label}</Badge>
}

export default function LoansList() {
  const [statusFilter, setStatusFilter] = useState<ListLoansStatus | "all">("all")

  const { data: loans, isLoading } = useListLoans(
    { status: statusFilter === "all" ? undefined : statusFilter }
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">Loans</h1>
          <p className="text-muted-foreground mt-1">Manage active loans and track payments.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="defaulted">Defaulted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Borrower</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>Next Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : loans?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No loans found.
                </TableCell>
              </TableRow>
            ) : (
              loans?.map((loan) => (
                <TableRow key={loan.id} className="group">
                  <TableCell>
                    <div className="font-medium">{loan.borrowerName}</div>
                    <div className="text-xs text-muted-foreground font-mono">{loan.id.substring(0,8)}...</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono">{formatCurrency(loan.principal)}</div>
                    <div className="text-xs text-muted-foreground">{loan.interestRate}% APR</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono font-medium">{formatCurrency(loan.balanceRemaining)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium font-mono">{formatCurrency(loan.monthlyPayment)}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(loan.nextDueDate), "MMM d, yyyy")}</div>
                  </TableCell>
                  <TableCell>
                    <LoanStatusBadge status={loan.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/loans/${loan.id}`}>
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
