import { useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useGetField,
  useUpdateField,
  useCreateFieldUpdate,
  useListFieldUpdates,
  useAssignField,
  useGetMe,
  useListUsers,
  useDeleteField,
  getGetFieldQueryKey,
  getListFieldUpdatesQueryKey,
  getListFieldsQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { Loader2, MapPin, Calendar, Edit, Shield, Activity, Plus, FileText, User as UserIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge, StageProgress, StageBadge } from "@/components/status-badge";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function FieldDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: field, isLoading: isFieldLoading } = useGetField(id, { 
    query: { enabled: !!id, queryKey: getGetFieldQueryKey(id) } 
  });
  const { data: updates, isLoading: isUpdatesLoading } = useListFieldUpdates(id, {
    query: { enabled: !!id, queryKey: getListFieldUpdatesQueryKey(id) }
  });
  const { data: users, isLoading: isUsersLoading } = useListUsers({
    query: { enabled: user?.role === 'admin' }
  });

  const updateField = useUpdateField();
  const createUpdate = useCreateFieldUpdate();
  const assignField = useAssignField();
  const deleteField = useDeleteField();

  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [updateStage, setUpdateStage] = useState<string>("");
  const [updateNote, setUpdateNote] = useState("");

  if (isUserLoading || isFieldLoading || isUpdatesLoading || (user?.role === 'admin' && isUsersLoading)) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!field) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Field not found</h2>
          <p className="text-muted-foreground mb-6">The field you're looking for doesn't exist or you don't have access to it.</p>
          <Link href="/fields">
            <Button>Back to Fields</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const handleCreateUpdate = () => {
    if (!updateStage && !updateNote) {
      toast({
        title: "Error",
        description: "Please provide a stage or a note.",
        variant: "destructive"
      });
      return;
    }

    createUpdate.mutate(
      { 
        id, 
        data: { 
          stage: updateStage ? (updateStage as any) : undefined, 
          note: updateNote || undefined 
        } 
      },
      {
        onSuccess: () => {
          toast({ title: "Update recorded successfully" });
          setIsUpdateOpen(false);
          setUpdateStage("");
          setUpdateNote("");
          queryClient.invalidateQueries({ queryKey: getGetFieldQueryKey(id) });
          queryClient.invalidateQueries({ queryKey: getListFieldUpdatesQueryKey(id) });
        },
        onError: (err: any) => {
          toast({
            title: "Failed to record update",
            description: err.message || "An unknown error occurred",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleAssign = (agentId: string) => {
    assignField.mutate(
      {
        id,
        data: { assignedAgentId: agentId === "unassigned" ? null : parseInt(agentId) }
      },
      {
        onSuccess: () => {
          toast({ title: "Agent assigned successfully" });
          queryClient.invalidateQueries({ queryKey: getGetFieldQueryKey(id) });
        },
        onError: (err: any) => {
          toast({
            title: "Failed to assign agent",
            description: err.message || "An unknown error occurred",
            variant: "destructive"
          });
        }
      }
    );
  };

  const handleDelete = () => {
    deleteField.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Field deleted successfully" });
          queryClient.invalidateQueries({ queryKey: getListFieldsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          setLocation("/fields");
        },
        onError: (err: any) => {
          toast({
            title: "Failed to delete field",
            description: err.message || "An unknown error occurred",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{field.name}</h1>
            <StatusBadge status={field.status} />
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <Badge variant="outline" className="bg-background">{field.cropType}</Badge>
            {field.areaHectares && (
              <span className="flex items-center text-sm">
                • {field.areaHectares} hectares
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {user?.role === 'admin' && (
            <>
              <Link href={`/fields/${id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Field
                </Button>
              </Link>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this field and all associated updates. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Field
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Lifecycle Stage</CardTitle>
              <CardDescription>Current progression of the crop</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1 w-full max-w-md">
                  <StageProgress currentStage={field.currentStage} />
                </div>
                
                <div className="flex flex-col items-start md:items-end">
                  <span className="text-sm text-muted-foreground mb-1">Current Stage</span>
                  <StageBadge stage={field.currentStage} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Field Updates</CardTitle>
                <CardDescription>Chronological log of activities and observations</CardDescription>
              </div>
              <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Update
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Field Update</DialogTitle>
                    <DialogDescription>
                      Log a new observation or update the crop's lifecycle stage.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Update Stage (Optional)</label>
                      <Select value={updateStage} onValueChange={setUpdateStage}>
                        <SelectTrigger>
                          <SelectValue placeholder="Leave unchanged" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Leave unchanged</SelectItem>
                          <SelectItem value="planted">Planted</SelectItem>
                          <SelectItem value="growing">Growing</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="harvested">Harvested</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Observation Notes</label>
                      <Textarea 
                        placeholder="Add notes about field conditions, growth, pests, etc..."
                        value={updateNote}
                        onChange={(e) => setUpdateNote(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateUpdate} disabled={createUpdate.isPending}>
                      {createUpdate.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Update
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {updates?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  No updates recorded yet.
                </div>
              ) : (
                <div className="space-y-8">
                  {updates?.map((update) => (
                    <div key={update.id} className="relative pl-6">
                      <div className="absolute left-0 top-1.5 h-full w-px bg-border last:bg-transparent -z-10"></div>
                      <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-background"></div>
                      
                      <div className="flex flex-col gap-2 bg-muted/30 p-4 rounded-lg border">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              {update.agentName || "Unknown Agent"}
                            </span>
                            {update.stage && (
                              <span className="text-sm text-muted-foreground flex items-center gap-2">
                                updated stage to <StageBadge stage={update.stage} />
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-md border">
                            {format(new Date(update.createdAt), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                        
                        {update.note && (
                          <div className="text-sm text-foreground mt-2">
                            {update.note}
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

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Planted On</p>
                  <p className="text-sm text-muted-foreground">{format(new Date(field.plantingDate), "MMMM d, yyyy")}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Location</p>
                  <p className="text-sm text-muted-foreground">{field.location || "Not specified"}</p>
                </div>
              </div>
              
              {field.notes && (
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Description</p>
                    <p className="text-sm text-muted-foreground">{field.notes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.role === 'admin' ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-2">Assign this field to an agent to allow them to log updates.</p>
                  <Select 
                    value={field.assignedAgentId?.toString() || "unassigned"} 
                    onValueChange={handleAssign}
                    disabled={assignField.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users?.filter(u => u.role === 'agent').map(agent => (
                        <SelectItem key={agent.id} value={agent.id.toString()}>
                          {agent.name || agent.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{field.assignedAgent?.name || field.assignedAgent?.email || "Unassigned"}</p>
                    <p className="text-xs text-muted-foreground">Assigned Agent</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function Badge({ children, className, variant = "default" }: any) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      variant === "outline" ? "border border-input text-foreground" : "bg-primary text-primary-foreground"
    } ${className}`}>
      {children}
    </span>
  );
}