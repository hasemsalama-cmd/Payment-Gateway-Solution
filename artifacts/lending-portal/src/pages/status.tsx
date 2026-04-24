import { useState } from "react"
import { Search, AlertCircle, Calendar, DollarSign, Clock, FileText } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"

import { useGetApplicationByReference } from "@workspace/api-client-react"
import { ApplicationStatus } from "@workspace/api-zod"

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const map: Record<ApplicationStatus, { label: string, className: string }> = {
    pending: { label: "Under Review", className: "bg-amber-100 text-amber-800 border-amber-200" },
    approved: { label: "Approved", className: "bg-green-100 text-green-800 border-green-200" },
    denied: { label: "Declined", className: "bg-red-100 text-red-800 border-red-200" },
    disbursed: { label: "Disbursed", className: "bg-blue-100 text-blue-800 border-blue-200" },
  }
  
  const mapped = map[status] || map.pending
  
  return (
    <Badge variant="outline" className={mapped.className}>
      {mapped.label}
    </Badge>
  )
}

export default function Status() {
  const [referenceInput, setReferenceInput] = useState("")
  const [searchRef, setSearchRef] = useState("")

  const { data, isLoading, isError, error } = useGetApplicationByReference(searchRef, {
    query: {
      enabled: !!searchRef,
      retry: false
    }
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (referenceInput.trim()) {
      setSearchRef(referenceInput.trim())
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-24 px-6 w-full">
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-serif text-foreground">Check Status</h1>
        <p className="text-muted-foreground text-lg">
          Enter your reference code to check the status of your loan application.
        </p>
      </div>

      <Card className="border shadow-sm mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Enter reference code (e.g. REF-12345)" 
                className="pl-10 h-14 text-lg font-mono"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8" disabled={isLoading || !referenceInput.trim()}>
              {isLoading ? "Searching..." : "Lookup"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            We couldn't find an application with that reference code. Please check and try again.
          </AlertDescription>
        </Alert>
      )}

      {data && !isLoading && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="overflow-hidden">
            <div className="bg-muted/30 px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Applicant</p>
                <p className="text-xl font-serif font-medium">{data.fullName}</p>
              </div>
              <div className="flex flex-col sm:items-end gap-1">
                <StatusBadge status={data.status} />
                <p className="text-xs text-muted-foreground font-mono">{data.referenceCode}</p>
              </div>
            </div>
            
            <CardContent className="p-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x border-b">
                <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Requested Amount</p>
                    <p className="text-xl font-bold font-mono">{formatCurrency(data.amountRequested)}</p>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Term</p>
                    <p className="text-xl font-bold font-mono">{data.termMonths} Months</p>
                  </div>
                </div>

                <div className="p-6 flex flex-col items-center justify-center text-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Submitted On</p>
                    <p className="text-lg font-medium">{format(new Date(data.createdAt), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </div>
              
              {data.status === 'approved' && data.approvedAmount && (
                <div className="p-6 bg-green-50/50 border-b border-green-100 flex flex-col items-center text-center space-y-2">
                  <p className="text-sm font-medium text-green-800 uppercase tracking-wide">Approved Details</p>
                  <p className="text-3xl font-serif text-green-900">{formatCurrency(data.approvedAmount)}</p>
                  <p className="text-sm text-green-700">at {data.suggestedInterestRate}% interest rate</p>
                </div>
              )}
              
              {data.status === 'denied' && data.denialReason && (
                <div className="p-6 bg-red-50/50 border-b border-red-100 space-y-2">
                  <p className="text-sm font-medium text-red-800 uppercase tracking-wide">Reason for decision</p>
                  <p className="text-red-900">{data.denialReason}</p>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
