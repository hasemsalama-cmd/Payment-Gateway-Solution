import { useState } from "react"
import { useParams, Link } from "wouter"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle, XCircle, FileText, ChevronRight } from "lucide-react"

import { useGetApplication, useDecideApplication, useDisburseApplication, getGetApplicationQueryKey } from "@workspace/api-client-react"
import { DecideApplicationBody } from "@workspace/api-zod"
import { useQueryClient } from "@tanstack/react-query"
import { formatCurrency, formatPercent } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type DecideFormValues = z.infer<typeof DecideApplicationBody>

export default function ApplicationDetail() {
  const { id } = useParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [approveOpen, setApproveOpen] = useState(false)
  const [denyOpen, setDenyOpen] = useState(false)

  const { data: app, isLoading } = useGetApplication(id!, {
    query: { enabled: !!id }
  })

  const decideMutation = useDecideApplication()
  const disburseMutation = useDisburseApplication()

  const approveForm = useForm<DecideFormValues>({
    resolver: zodResolver(DecideApplicationBody),
    defaultValues: {
      decision: "approve",
      approvedAmount: app?.amountRequested || 0,
      interestRate: app?.suggestedInterestRate || 0,
    },
  })

  const denyForm = useForm<DecideFormValues>({
    resolver: zodResolver(DecideApplicationBody),
    defaultValues: {
      decision: "deny",
      denialReason: "",
    },
  })

  if (isLoading || !app) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const onApprove = (data: DecideFormValues) => {
    decideMutation.mutate(
      { id: id!, data },
      {
        onSuccess: () => {
          toast({ title: "Application Approved", description: "The loan is now ready for disbursement." })
          setApproveOpen(false)
          queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(id!) })
        }
      }
    )
  }

  const onDeny = (data: DecideFormValues) => {
    decideMutation.mutate(
      { id: id!, data },
      {
        onSuccess: () => {
          toast({ title: "Application Denied", description: "The applicant will be notified." })
          setDenyOpen(false)
          queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(id!) })
        }
      }
    )
  }

  const handleDisburse = () => {
    disburseMutation.mutate(
      { id: id! },
      {
        onSuccess: (loan) => {
          toast({ title: "Loan Disbursed", description: "Funds have been recorded as sent." })
          queryClient.invalidateQueries({ queryKey: getGetApplicationQueryKey(id!) })
        }
      }
    )
  }

  const isPending = app.status === "pending"
  const isApproved = app.status === "approved"
  const isDisbursed = app.status === "disbursed"

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/applications">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">{app.fullName}</h1>
            <Badge variant="outline" className="uppercase tracking-wider text-[10px]">{app.status}</Badge>
          </div>
          <p className="text-muted-foreground font-mono text-sm">{app.referenceCode} • Submitted {format(new Date(app.createdAt), "MMM d, yyyy")}</p>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          {isPending && (
            <>
              <Dialog open={denyOpen} onOpenChange={setDenyOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200">Decline</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Decline Application</DialogTitle>
                    <DialogDescription>Please provide a reason for declining this application.</DialogDescription>
                  </DialogHeader>
                  <Form {...denyForm}>
                    <form onSubmit={denyForm.handleSubmit(onDeny)} className="space-y-4">
                      <FormField
                        control={denyForm.control}
                        name="denialReason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Credit score below threshold, high DTI..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDenyOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="destructive" disabled={decideMutation.isPending}>
                          {decideMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirm Decline
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={approveOpen} onOpenChange={(open) => {
                if (open) {
                  approveForm.reset({
                    decision: "approve",
                    approvedAmount: app.amountRequested,
                    interestRate: app.suggestedInterestRate
                  })
                }
                setApproveOpen(open)
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-green-700 hover:bg-green-800 text-white">Approve Loan</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Approve Application</DialogTitle>
                    <DialogDescription>Confirm the final loan terms before approval.</DialogDescription>
                  </DialogHeader>
                  <Form {...approveForm}>
                    <form onSubmit={approveForm.handleSubmit(onApprove)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={approveForm.control}
                          name="approvedAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Approved Amount ($)</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={approveForm.control}
                          name="interestRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Interest Rate (%)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setApproveOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white" disabled={decideMutation.isPending}>
                          {decideMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirm Approval
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </>
          )}

          {isApproved && (
            <Button onClick={handleDisburse} disabled={disburseMutation.isPending}>
              {disburseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disburse Funds
            </Button>
          )}

          {isDisbursed && (
             <Link href="/admin/loans">
               <Button variant="secondary">Go to Loan <ChevronRight className="ml-2 h-4 w-4" /></Button>
             </Link>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Score & Risk Analysis */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-primary/20 shadow-sm">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg font-serif">Risk Profile</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col items-center justify-center text-center space-y-2 pb-4 border-b">
                <div className={`text-5xl font-mono font-bold tracking-tighter ${app.score >= 80 ? 'text-green-600' : app.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                  {app.score}
                </div>
                <Badge variant="outline" className={
                  app.recommendation === 'approve' ? 'bg-green-50 text-green-700' :
                  app.recommendation === 'review' ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }>
                  {app.recommendation.toUpperCase()}
                </Badge>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Key Factors</h4>
                {app.factors.map((f, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    {f.impact > 0 ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" /> : <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                    <div>
                      <p className="font-medium text-foreground leading-none">{f.label}</p>
                      <p className="text-muted-foreground text-xs mt-1">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                   <span className="text-sm text-muted-foreground">Suggested Rate</span>
                   <span className="font-mono font-medium">{app.suggestedInterestRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm text-muted-foreground">DTI Ratio</span>
                   <span className={`font-mono font-medium ${app.debtToIncomeRatio > 40 ? 'text-red-600' : ''}`}>{app.debtToIncomeRatio.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm text-muted-foreground">PTI Ratio</span>
                   <span className={`font-mono font-medium ${app.paymentToIncomeRatio > 15 ? 'text-red-600' : ''}`}>{app.paymentToIncomeRatio.toFixed(1)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Application Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Amount Requested</dt>
                  <dd className="text-2xl font-mono mt-1">{formatCurrency(app.amountRequested)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Term</dt>
                  <dd className="text-2xl font-mono mt-1">{app.termMonths} Months</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-muted-foreground">Purpose</dt>
                  <dd className="mt-1 text-foreground">{app.purpose}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-serif">Applicant Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Contact</dt>
                  <dd className="mt-1 flex flex-col space-y-1">
                    <span>{app.email}</span>
                    <span>{app.phone}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Employment</dt>
                  <dd className="mt-1 capitalize">{app.employmentStatus.replace('_', ' ')}</dd>
                </div>
                <div className="sm:col-span-2 border-t pt-4 grid grid-cols-3 gap-4">
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Income</dt>
                    <dd className="mt-1 font-mono">{formatCurrency(app.monthlyIncome)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Monthly Expenses</dt>
                    <dd className="mt-1 font-mono">{formatCurrency(app.monthlyExpenses)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Existing Debt</dt>
                    <dd className="mt-1 font-mono">{formatCurrency(app.existingDebt)}</dd>
                  </div>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
