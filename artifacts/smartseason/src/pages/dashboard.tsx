import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useGetDashboardSummary, 
  useGetMe, 
  useGetRecentActivity, 
  useGetStageBreakdown,
  useListFields
} from "@workspace/api-client-react";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2, Map, Activity, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, StageProgress } from "@/components/status-badge";
import { format } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: summary, isLoading: isSummaryLoading } = useGetDashboardSummary();
  const { data: activity, isLoading: isActivityLoading } = useGetRecentActivity({ limit: 5 });
  const { data: stageBreakdown, isLoading: isStageLoading } = useGetStageBreakdown();
  const { data: fields, isLoading: isFieldsLoading } = useListFields({ agentId: user?.role === 'agent' ? user.id : undefined });

  if (isUserLoading || isSummaryLoading || isActivityLoading || isStageLoading || isFieldsLoading) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Determine which fields to show based on role
  const recentFields = fields?.slice(0, 5) || [];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {user?.name || 'Agent'}</h1>
        <p className="text-muted-foreground">
          {user?.role === 'admin' 
            ? "Here's the current status of all field operations."
            : "Here's the latest on your assigned fields."}
        </p>
      </div>

      {user?.role === 'admin' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Fields" 
            value={summary.totalFields} 
            icon={Map} 
            description={`${summary.unassignedFields} unassigned`} 
          />
          <StatCard 
            title="Active Operations" 
            value={summary.activeFields} 
            icon={Activity} 
            className="text-blue-600"
          />
          <StatCard 
            title="At Risk" 
            value={summary.atRiskFields} 
            icon={AlertTriangle} 
            className="text-amber-600"
          />
          <StatCard 
            title="Completed" 
            value={summary.completedFields} 
            icon={CheckCircle2} 
            className="text-emerald-600"
          />
        </div>
      )}

      {user?.role === 'agent' && fields && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Assigned Fields" 
            value={fields.length} 
            icon={Map} 
          />
          <StatCard 
            title="Active" 
            value={fields.filter(f => f.status === 'active').length} 
            icon={Activity} 
            className="text-blue-600"
          />
          <StatCard 
            title="Needs Attention" 
            value={fields.filter(f => f.status === 'at_risk').length} 
            icon={AlertTriangle} 
            className="text-amber-600"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Charts & Lists */}
        <div className="lg:col-span-2 space-y-8">
          
          {user?.role === 'admin' && stageBreakdown && stageBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Field Stages</CardTitle>
                <CardDescription>Current lifecycle distribution across all active fields</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageBreakdown} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="stage" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
                      />
                      <YAxis 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        allowDecimals={false}
                      />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)'
                        }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {stageBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{user?.role === 'admin' ? "Recent Fields" : "Your Fields"}</CardTitle>
                <CardDescription>Overview of monitored locations</CardDescription>
              </div>
              <Link href="/fields">
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  No fields to display.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentFields.map((field) => (
                    <div key={field.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4 hover:bg-muted/50 transition-colors">
                      <div>
                        <Link href={`/fields/${field.id}`}>
                          <h4 className="font-semibold text-lg hover:underline hover:text-primary cursor-pointer">{field.name}</h4>
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Badge variant="outline">{field.cropType}</Badge>
                          {field.areaHectares && <span>• {field.areaHectares} ha</span>}
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <StatusBadge status={field.status} />
                        <StageProgress currentStage={field.currentStage} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity Feed */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates from the field</CardDescription>
            </CardHeader>
            <CardContent>
              {activity?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent activity.
                </div>
              ) : (
                <div className="space-y-6">
                  {activity?.map((item) => (
                    <div key={item.id} className="relative pl-6 pb-6 last:pb-0">
                      <div className="absolute left-0 top-1.5 h-full w-px bg-border last:bg-transparent"></div>
                      <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-background"></div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/fields/${item.fieldId}`}>
                            <span className="font-medium hover:underline cursor-pointer text-sm">{item.fieldName}</span>
                          </Link>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(item.createdAt), "MMM d, h:mm a")}
                          </span>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {item.agentName && <span className="font-medium text-foreground">{item.agentName}</span>}
                          {item.agentName && (item.stage || item.note) && " updated "}
                          {item.stage && (
                            <Badge variant="secondary" className="mr-1 capitalize text-xs">
                              {item.stage}
                            </Badge>
                          )}
                        </div>
                        
                        {item.note && (
                          <div className="mt-2 text-sm bg-muted p-3 rounded-md italic border-l-2 border-primary/30">
                            "{item.note}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, description, className }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className={`h-5 w-5 text-muted-foreground ${className || ''}`} />
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {description && (
            <span className="text-xs text-muted-foreground mt-1">{description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}