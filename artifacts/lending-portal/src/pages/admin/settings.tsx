import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Calculator } from "lucide-react"

import { useGetScoringRules, useUpdateScoringRules, usePreviewScore, getGetScoringRulesQueryKey } from "@workspace/api-client-react"
import { UpdateScoringRulesBody, PreviewScoreBody } from "@workspace/api-zod"
import { useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

type RulesFormValues = z.infer<typeof UpdateScoringRulesBody>
type PreviewFormValues = z.infer<typeof PreviewScoreBody>

export default function Settings() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { data: rules, isLoading: loadingRules } = useGetScoringRules()
  const updateMutation = useUpdateScoringRules()
  const previewMutation = usePreviewScore()

  const rulesForm = useForm<RulesFormValues>({
    resolver: zodResolver(UpdateScoringRulesBody),
    defaultValues: {
      approveThreshold: 0,
      reviewThreshold: 0,
      maxDebtToIncomeRatio: 0,
      maxPaymentToIncomeRatio: 0,
      baseInterestRate: 0,
      riskPremiumPerBand: 0,
    }
  })

  useEffect(() => {
    if (rules) {
      rulesForm.reset(rules)
    }
  }, [rules, rulesForm])

  const previewForm = useForm<PreviewFormValues>({
    resolver: zodResolver(PreviewScoreBody),
    defaultValues: {
      fullName: "Test User",
      email: "test@example.com",
      phone: "555-0000",
      amountRequested: 25000,
      termMonths: 24,
      purpose: "Testing",
      employmentStatus: "employed",
      monthlyIncome: 10000,
      monthlyExpenses: 3000,
      existingDebt: 500,
    }
  })

  if (loadingRules) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
  }

  const onSaveRules = (data: RulesFormValues) => {
    updateMutation.mutate(
      { data },
      {
        onSuccess: (newRules) => {
          toast({ title: "Rules Updated", description: "Scoring rules have been saved successfully." })
          queryClient.setQueryData(getGetScoringRulesQueryKey(), newRules)
        }
      }
    )
  }

  const onPreview = (data: PreviewFormValues) => {
    previewMutation.mutate({ data })
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-serif font-semibold tracking-tight text-foreground">Scoring Settings</h1>
        <p className="text-muted-foreground mt-1">Configure automated decision thresholds and rate calculations.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        {/* Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Algorithm Configuration</CardTitle>
            <CardDescription>Adjustments here apply immediately to all new applications.</CardDescription>
          </CardHeader>
          <Form {...rulesForm}>
            <form onSubmit={rulesForm.handleSubmit(onSaveRules)}>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Decision Thresholds</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={rulesForm.control} name="approveThreshold" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auto-Approve Score</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        <FormDescription className="text-xs">Scores above this get "approve".</FormDescription>
                      </FormItem>
                    )} />
                    <FormField control={rulesForm.control} name="reviewThreshold" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manual Review Score</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        <FormDescription className="text-xs">Scores below this get "deny".</FormDescription>
                      </FormItem>
                    )} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Hard Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={rulesForm.control} name="maxDebtToIncomeRatio" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max DTI Ratio (%)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={rulesForm.control} name="maxPaymentToIncomeRatio" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max PTI Ratio (%)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      </FormItem>
                    )} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pricing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={rulesForm.control} name="baseInterestRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Rate (%)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={rulesForm.control} name="riskPremiumPerBand" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk Premium (%)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        <FormDescription className="text-xs">Added to base rate per lower band.</FormDescription>
                      </FormItem>
                    )} />
                  </div>
                </div>

              </CardContent>
              <CardFooter className="bg-muted/30 border-t justify-end py-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Configuration
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        {/* Score Simulator */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
             <CardTitle className="font-serif flex items-center gap-2"><Calculator className="h-5 w-5" /> Score Simulator</CardTitle>
             <CardDescription>Test how the current rules would score a hypothetical applicant.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <Form {...previewForm}>
                <form id="simulator-form" onSubmit={previewForm.handleSubmit(onPreview)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={previewForm.control} name="amountRequested" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loan Amount ($)</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={previewForm.control} name="termMonths" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Term (Months)</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 border-t border-primary/10 pt-4">
                    <FormField control={previewForm.control} name="monthlyIncome" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Mo. Income</FormLabel>
                          <FormControl><Input type="number" className="h-8 text-sm" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={previewForm.control} name="monthlyExpenses" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Mo. Expenses</FormLabel>
                          <FormControl><Input type="number" className="h-8 text-sm" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={previewForm.control} name="existingDebt" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Mo. Debt</FormLabel>
                          <FormControl><Input type="number" className="h-8 text-sm" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                        </FormItem>
                    )} />
                  </div>
                  <Button type="submit" form="simulator-form" variant="secondary" className="w-full" disabled={previewMutation.isPending}>
                    {previewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Run Simulation
                  </Button>
                </form>
             </Form>

             {previewMutation.data && (
                <div className="bg-background rounded-lg p-4 border shadow-sm mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Result</div>
                    <Badge variant={previewMutation.data.recommendation === 'approve' ? 'default' : previewMutation.data.recommendation === 'review' ? 'secondary' : 'destructive'}>
                      {previewMutation.data.recommendation.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Score</p>
                      <p className="text-3xl font-mono font-bold">{previewMutation.data.score}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rate</p>
                      <p className="text-3xl font-mono font-bold">{previewMutation.data.suggestedInterestRate.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
