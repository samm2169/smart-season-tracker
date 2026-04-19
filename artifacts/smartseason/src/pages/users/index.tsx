import { useState } from "react";
import { Layout } from "@/components/layout";
import { 
  useListUsers, 
  useUpdateUserRole, 
  useGetMe,
  getListUsersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Shield, User as UserIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  Body,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function UsersList() {
  const { data: currentUser, isLoading: isCurrentUserLoading } = useGetMe();
  const { data: users, isLoading: isUsersLoading } = useListUsers({
    query: { enabled: currentUser?.role === 'admin' }
  });
  
  const updateUserRole = useUpdateUserRole();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [search, setSearch] = useState("");

  if (isCurrentUserLoading || (currentUser?.role === 'admin' && isUsersLoading)) {
    return (
      <Layout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (currentUser?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Unauthorized</h2>
          <p className="text-muted-foreground">Only administrators can manage users.</p>
        </div>
      </Layout>
    );
  }

  const handleRoleChange = (userId: number, newRole: string) => {
    updateUserRole.mutate(
      { id: userId, data: { role: newRole as "admin" | "agent" } },
      {
        onSuccess: () => {
          toast({ title: "User role updated successfully" });
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        },
        onError: (err: any) => {
          toast({
            title: "Failed to update role",
            description: err.message || "An unknown error occurred",
            variant: "destructive"
          });
        }
      }
    );
  };

  const filteredUsers = users?.filter(u => 
    search ? (
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) || 
      u.email.toLowerCase().includes(search.toLowerCase())
    ) : true
  );

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">Manage field agents and administrators.</p>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        <div className="p-4 border-b flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <UserIcon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">
                        {user.name || "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-500/20">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Agent
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <Select 
                        defaultValue={user.role} 
                        onValueChange={(val) => handleRoleChange(user.id, val)}
                        disabled={user.id === currentUser.id || updateUserRole.isPending}
                      >
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="agent">Agent</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}