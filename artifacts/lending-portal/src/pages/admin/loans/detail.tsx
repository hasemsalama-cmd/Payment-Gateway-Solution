import { useState } from "react"
import { useParams, Link } from "wouter"
import { format } from "date-fns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ArrowLeft, PlusCircle, CheckCircle2 } from "lucide-react"

import { useGetLoan, useRecordPayment, getGetLoanQueryKey } from "@workspace/api-client-react"
import { RecordPaymentBody } from "@workspace/api-zod"
import { useQueryClient } from "@tanstack/react-query"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

type PaymentFormValues = z.infer<typeof RecordPaymentBody>

export default function LoanDetail() {
  const { id } = useParams()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [paymentOpen, setPaymentOpen] = useState(false)

  const { data, isLoading } = useGetLoan(id!, { query: { enabled: !!id } })
  const paymentMutation = useRecordPayment()

  const paymentForm = useForm<PaymentFormValues>({
    resolver: zodResolver(RecordPaymentBody),
    defaultValues: {
      amount: 0,
      method: "bank_transfer",
      notes: "",
    },
  })

  if (isLoading || !data) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const { loan, schedule, payments } = data

  const onRecordPayment = (values: PaymentFormValues) => {
    paymentMutation.mutate(
      { id: id!, data: values },
      {
        onSuccess: () => {
          toast({ title: "Payment Recorded", description: "The loan balance has been updated." })
          setPaymentOpen(false)
          queryClient.invalidateQueries({ queryKey: getGetLoanQueryKey(id!) })
          paymentForm.reset()
        }
      }
    )
  }

  const progressPercent = loan.principal > 0 ? (loan.totalPaid / loan.principal) * 100 : 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/loans">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">{loan.borrowerName}</h1>
            <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="uppercase tracking-wider text-[10px]">
              {loan.status}
            </Badge>
          </div>
          <p className="text-muted-foreground font-mono text-sm">Loan ID: {loan.id} • Started {format(new Date(loan.startDate), "MMM d, yyyy")}</p>
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/admin/applications/${loan.applicationId}`}>
            <Button variant="outline">View Original Application</Button>
          </Link>
          {loan.status === 'active' && (
            <Dialog open={paymentOpen} onOpenChange={(open) => {
              if (open) {
                paymentForm.setValue('amount', loan.monthlyPayment)
              }
              setPaymentOpen(open)
            }}>
              <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Record Payment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                </DialogHeader>
                <Form {...paymentForm}>
                  <form onSubmit={paymentForm.handleSubmit(onRecordPayment)} className="space-y-4">
                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Method</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Reference ID, check number..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={paymentMutation.isPending}>
                        {paymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Record Payment
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <Card className="md:col-span-3">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Original Principal</p>
                <p className="text-2xl font-mono mt-1">{formatCurrency(loan.principal)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                <p className="text-2xl font-mono mt-1">{loan.interestRate}%</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Payment</p>
                <p className="text-2xl font-mono mt-1">{formatCurrency(loan.monthlyPayment)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Next Due Date</p>
                <p className="text-2xl mt-1">{format(new Date(loan.nextDueDate), "MMM d, yyyy")}</p>
              </div>
            </div>
            
            <div className="mt-8 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Repayment Progress</span>
                <span className="font-medium font-mono">{formatCurrency(loan.totalPaid)} / {formatCurrency(loan.principal)}</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-sm text-right text-muted-foreground font-mono">{formatCurrency(loan.balanceRemaining)} remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Amortization Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-card">
                    <TableRow>
                      <TableHead className="w-12">No.</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Payment</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="font-mono text-sm">
                    {schedule.map((row) => (
                      <TableRow key={row.installment} className={row.paid ? "bg-muted/30 text-muted-foreground" : ""}>
                        <TableCell>{row.installment}</TableCell>
                        <TableCell className="font-sans">{format(new Date(row.dueDate), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.principal)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.interest)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(row.balance)}</TableCell>
                        <TableCell>
                          {row.paid && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1 space-y-6">
           <Card>
            <CardHeader>
              <CardTitle className="font-serif">Payment History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No payments recorded yet.</div>
              ) : (
                <div className="divide-y max-h-[500px] overflow-y-auto">
                  {payments.map(p => (
                    <div key={p.id} className="p-4 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-medium text-foreground">{formatCurrency(p.amount)}</span>
                        <span className="text-xs text-muted-foreground">{format(new Date(p.paidAt), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span className="capitalize">{p.method.replace('_', ' ')}</span>
                        {p.notes && <span className="truncate max-w-[120px]" title={p.notes}>{p.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
