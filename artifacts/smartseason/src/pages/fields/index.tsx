import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListFields, useGetMe } from "@workspace/api-client-react";
import { Loader2, Plus, Search, Filter, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, StageBadge } from "@/components/status-badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";

export default function FieldsList() {
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: fields, isLoading: isFieldsLoading } = useListFields({
    agentId: user?.role === 'agent' ? user.id : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    stage: stageFilter !== "all" ? stageFilter : undefined,
  });

  if (isUserLoading || isFieldsLoading) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const filteredFields = fields?.filter(f => 
    search ? (f.name.toLowerCase().includes(search.toLowerCase()) || f.cropType.toLowerCase().includes(search.toLowerCase())) : true
  );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fields</h1>
          <p className="text-muted-foreground">Manage and monitor field lifecycle stages.</p>
        </div>
        
        {user?.role === 'admin' && (
          <Link href="/fields/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-card border rounded-lg p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search fields or crop types..." 
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-full md:w-40">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="at_risk">At Risk</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-40">
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Stage" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="planted">Planted</SelectItem>
                <SelectItem value="growing">Growing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="harvested">Harvested</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filteredFields?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-xl bg-muted/20">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">No fields found</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Try adjusting your search or filters. {user?.role === 'admin' && "Or create a new field to get started."}
          </p>
          {user?.role === 'admin' && (
            <Link href="/fields/new">
              <Button className="mt-6" variant="outline">Create Field</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFields?.map((field) => (
            <Card key={field.id} className="hover:border-primary/50 transition-colors flex flex-col">
              <CardHeader className="pb-4 border-b">
                <div className="flex justify-between items-start mb-2 gap-2">
                  <CardTitle className="text-xl line-clamp-1" title={field.name}>{field.name}</CardTitle>
                  <StatusBadge status={field.status} />
                </div>
                <CardDescription className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{field.cropType}</span>
                  {field.areaHectares && (
                    <>
                      <span>•</span>
                      <span>{field.areaHectares} ha</span>
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Current Stage</p>
                    <StageBadge stage={field.currentStage} />
                  </div>
                  
                  {field.location && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-muted-foreground line-clamp-2" title={field.location}>{field.location}</span>
                    </div>
                  )}

                  <div className="text-sm grid grid-cols-2 gap-y-2">
                    <div>
                      <p className="text-muted-foreground">Planted</p>
                      <p className="font-medium">{format(new Date(field.plantingDate), "MMM d, yyyy")}</p>
                    </div>
                    {user?.role === 'admin' && (
                      <div>
                        <p className="text-muted-foreground">Agent</p>
                        <p className="font-medium truncate">{field.assignedAgent?.name || field.assignedAgent?.email || 'Unassigned'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4 border-t bg-muted/20">
                <Link href={`/fields/${field.id}`} className="w-full">
                  <Button variant="secondary" className="w-full">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}