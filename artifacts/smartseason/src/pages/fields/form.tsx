import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Layout } from "@/components/layout";
import { 
  useCreateField, 
  useUpdateField, 
  useGetField, 
  useListUsers,
  useGetMe,
  getGetFieldQueryKey,
  getListFieldsQueryKey
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const fieldSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  cropType: z.string().min(2, "Crop type must be at least 2 characters").max(50),
  plantingDate: z.string().min(1, "Planting date is required"),
  currentStage: z.enum(["planted", "growing", "ready", "harvested"]),
  notes: z.string().optional(),
  location: z.string().optional(),
  areaHectares: z.coerce.number().min(0.01, "Area must be greater than 0").optional().or(z.literal("").transform(() => undefined)),
  assignedAgentId: z.coerce.number().optional().or(z.literal("").transform(() => undefined)),
});

type FieldFormValues = z.infer<typeof fieldSchema>;

export default function FieldForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEdit = !!params.id && params.id !== "new";
  const fieldId = isEdit ? parseInt(params.id!) : 0;

  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: users, isLoading: isUsersLoading } = useListUsers({
    query: { enabled: user?.role === 'admin' }
  });
  
  const { data: field, isLoading: isFieldLoading } = useGetField(fieldId, {
    query: { enabled: isEdit, queryKey: getGetFieldQueryKey(fieldId) }
  });

  const createField = useCreateField();
  const updateField = useUpdateField();

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    defaultValues: {
      name: "",
      cropType: "",
      plantingDate: new Date().toISOString().split("T")[0],
      currentStage: "planted",
      notes: "",
      location: "",
      areaHectares: undefined,
      assignedAgentId: undefined,
    },
  });

  useEffect(() => {
    if (isEdit && field) {
      form.reset({
        name: field.name,
        cropType: field.cropType,
        plantingDate: new Date(field.plantingDate).toISOString().split("T")[0],
        currentStage: field.currentStage,
        notes: field.notes || "",
        location: field.location || "",
        areaHectares: field.areaHectares || undefined,
        assignedAgentId: field.assignedAgentId || undefined,
      });
    }
  }, [isEdit, field, form]);

  if (isUserLoading || (isEdit && isFieldLoading) || isUsersLoading) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Unauthorized</h2>
          <p className="text-muted-foreground mb-6">Only administrators can create or edit fields.</p>
          <Button onClick={() => setLocation("/fields")}>Back to Fields</Button>
        </div>
      </Layout>
    );
  }

  const onSubmit = (values: FieldFormValues) => {
    // Format data for API
    const dataToSubmit = {
      ...values,
      notes: values.notes || undefined,
      location: values.location || undefined,
    };

    if (isEdit) {
      updateField.mutate(
        { id: fieldId, data: dataToSubmit },
        {
          onSuccess: (updatedField) => {
            toast({ title: "Field updated successfully" });
            queryClient.invalidateQueries({ queryKey: getGetFieldQueryKey(fieldId) });
            queryClient.invalidateQueries({ queryKey: getListFieldsQueryKey() });
            setLocation(`/fields/${updatedField.id}`);
          },
          onError: (err: any) => {
            toast({
              title: "Failed to update field",
              description: err.message || "An unknown error occurred",
              variant: "destructive"
            });
          }
        }
      );
    } else {
      createField.mutate(
        { data: dataToSubmit },
        {
          onSuccess: (newField) => {
            toast({ title: "Field created successfully" });
            queryClient.invalidateQueries({ queryKey: getListFieldsQueryKey() });
            setLocation(`/fields/${newField.id}`);
          },
          onError: (err: any) => {
            toast({
              title: "Failed to create field",
              description: err.message || "An unknown error occurred",
              variant: "destructive"
            });
          }
        }
      );
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" className="mb-4 -ml-4 text-muted-foreground" onClick={() => setLocation(isEdit ? `/fields/${fieldId}` : "/fields")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? "Edit Field" : "Create New Field"}</h1>
          <p className="text-muted-foreground">
            {isEdit ? "Update field information and assignment." : "Add a new field to monitor its lifecycle."}
          </p>
        </div>

        <div className="bg-card border rounded-xl p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. North Plot 12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cropType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Crop Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Corn, Soybeans, Wheat" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plantingDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planting Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentStage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Stage</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a stage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planted">Planted</SelectItem>
                          <SelectItem value="growing">Growing</SelectItem>
                          <SelectItem value="ready">Ready for Harvest</SelectItem>
                          <SelectItem value="harvested">Harvested</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="areaHectares"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Area (Hectares)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g. 5.5" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assignedAgentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Agent</FormLabel>
                      <Select onValueChange={(val) => field.onChange(val ? parseInt(val) : undefined)} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {users?.filter(u => u.role === 'agent').map(agent => (
                            <SelectItem key={agent.id} value={agent.id.toString()}>
                              {agent.name || agent.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Near the main reservoir" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional information about this field..."
                        className="resize-y" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setLocation(isEdit ? `/fields/${fieldId}` : "/fields")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createField.isPending || updateField.isPending}>
                  {(createField.isPending || updateField.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEdit ? "Save Changes" : "Create Field"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}