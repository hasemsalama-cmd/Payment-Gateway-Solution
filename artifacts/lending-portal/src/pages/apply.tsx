import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Copy, CheckCircle2, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Link } from "wouter"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatCurrency } from "@/lib/utils"

import { CreateApplicationBody } from "@workspace/api-zod"
import { useCreateApplication, usePreviewScore } from "@workspace/api-client-react"
import { useToast } from "@/hooks/use-toast"

type ApplicationFormValues = z.infer<typeof CreateApplicationBody>

export default function Apply() {
  const { toast } = useToast()
  const [submittedRef, setSubmittedRef] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  const createApplication = useCreateApplication()
  const previewScore = usePreviewScore()

  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(CreateApplicationBody),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      amountRequested: 10000,
      termMonths: 12,
      purpose: "",
      employmentStatus: "employed",
      monthlyIncome: 0,
      monthlyExpenses: 0,
      existingDebt: 0,
    },
  })

  const { watch } = form
  const values = watch()

  // Debounce score preview
  useEffect(() => {
    const amount = values.amountRequested
    const income = values.monthlyIncome
    const term = values.termMonths
    
    if (amount >= 100 && income > 0 && term >= 3) {
      const timer = setTimeout(() => {
        previewScore.mutate({ data: values as any })
      }, 800)
      return () => clearTimeout(timer)
    }
  }, [
    values.amountRequested, 
    values.monthlyIncome, 
    values.monthlyExpenses, 
    values.existingDebt, 
    values.termMonths,
    values.employmentStatus
  ])

  function onSubmit(data: ApplicationFormValues) {
    createApplication.mutate(
      { data },
      {
        onSuccess: (result) => {
          setSubmittedRef(result.referenceCode)
          toast({
            title: "Application Submitted",
            description: "We've received your application and will review it shortly.",
          })
        },
        onError: (err: any) => {
          toast({
            title: "Submission Failed",
            description: err.message || "An error occurred while submitting.",
            variant: "destructive",
          })
        }
      }
    )
  }

  const copyToClipboard = () => {
    if (submittedRef) {
      navigator.clipboard.writeText(submittedRef)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (submittedRef) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-6">
        <Card className="text-center p-8 border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-3xl font-serif text-green-900">Application Received</CardTitle>
            <CardDescription className="text-green-800/80 text-lg mt-4">
              Thank you for applying. We are reviewing your details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="bg-white p-6 rounded-xl border border-green-100 shadow-sm space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Reference Code</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-3xl font-mono font-bold tracking-widest text-foreground bg-muted/50 px-4 py-2 rounded-lg">
                  {submittedRef}
                </code>
                <Button variant="outline" size="icon" onClick={copyToClipboard} className="h-12 w-12 rounded-lg">
                  {copied ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Save this code. You will need it to check your application status.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center pt-8">
            <Link href="/status">
              <Button size="lg">Check Status Now</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  const isPendingPreview = previewScore.isPending
  const previewData = previewScore.data

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 w-full">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-serif text-foreground">Loan Application</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Tell us about yourself and your financial needs. We'll provide a transparent estimate instantly.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_320px] gap-8 items-start">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-card border shadow-sm rounded-xl p-6 md:p-8">
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-serif font-medium">Personal Details</h3>
              </div>
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="jane@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-serif font-medium">Loan Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amountRequested"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Requested ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min={100} {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="termMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term Length (Months)</FormLabel>
                      <FormControl>
                        <Input type="number" min={3} max={60} {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of Loan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="How will you use these funds?" className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-serif font-medium">Financial Information</h3>
              </div>
              
              <FormField
                control={form.control}
                name="employmentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employment Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employed">Employed</SelectItem>
                        <SelectItem value="self_employed">Self Employed</SelectItem>
                        <SelectItem value="unemployed">Unemployed</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="monthlyIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Income ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="monthlyExpenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Expenses ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="existingDebt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Existing Debt ($)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full h-14 text-lg" disabled={createApplication.isPending}>
              {createApplication.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Submit Application
            </Button>
          </form>
        </Form>

        {/* Live Preview Sidebar */}
        <div className="sticky top-24 space-y-6">
          <Card className="bg-muted/30 border-none shadow-none">
            <CardHeader className="pb-4">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                Estimate
                {isPendingPreview && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {previewData ? (
                <>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Estimated Monthly Payment</p>
                    <p className="text-3xl font-bold font-mono text-foreground">
                       {formatCurrency(
                         (values.amountRequested * (1 + (previewData.suggestedInterestRate / 100))) / values.termMonths
                       )}
                    </p>
                    <p className="text-xs text-muted-foreground pt-1">
                      Based on a {previewData.suggestedInterestRate.toFixed(2)}% estimated interest rate.
                    </p>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Debt-to-Income</span>
                      <span className={`text-sm font-medium ${(previewData.debtToIncomeRatio > 40) ? 'text-destructive' : 'text-foreground'}`}>
                        {previewData.debtToIncomeRatio.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Payment-to-Income</span>
                      <span className={`text-sm font-medium ${(previewData.paymentToIncomeRatio > 15) ? 'text-destructive' : 'text-foreground'}`}>
                        {previewData.paymentToIncomeRatio.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {(previewData.debtToIncomeRatio > 40 || previewData.paymentToIncomeRatio > 15) && (
                    <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle className="text-xs font-semibold mb-1">High Ratios</AlertTitle>
                      <AlertDescription className="text-xs opacity-90">
                        These ratios may affect your likelihood of approval. Consider requesting a lower amount or longer term.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Fill out your financial details to see an estimate.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
