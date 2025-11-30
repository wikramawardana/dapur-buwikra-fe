"use client";

import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Shield,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { authClient, useSession } from "@/lib/auth-client";

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string | null;
  createdAt: Date;
  banned: boolean | null;
}

const ROLES = [
  {
    value: "admin",
    label: "Admin",
    description: "Full access to all features",
  },
  {
    value: "staff",
    label: "Staff",
    description: "Can manage orders and customers",
  },
  { value: "user", label: "User", description: "No access (pending approval)" },
];

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<string>("");
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const pageSize = 10;

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await authClient.admin.listUsers({
        query: {
          limit: pageSize,
          offset: (currentPage - 1) * pageSize,
          searchValue: searchQuery || undefined,
          searchField: searchQuery ? "email" : undefined,
        },
      });

      if (response.data) {
        setUsers(response.data.users as User[]);
        setTotalPages(Math.ceil((response.data.total || 0) / pageSize));
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateRole = async () => {
    if (!selectedUser || !selectedRole) return;

    setIsUpdating(true);
    try {
      await authClient.admin.setRole({
        userId: selectedUser.id,
        role: selectedRole as "user" | "admin",
      });

      toast.success(
        `Role updated to ${selectedRole} for ${selectedUser.email}`,
      );
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole("");
      fetchUsers();
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update user role");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBanUser = async (user: User) => {
    try {
      if (user.banned) {
        await authClient.admin.unbanUser({ userId: user.id });
        toast.success(`${user.email} has been unbanned`);
      } else {
        await authClient.admin.banUser({ userId: user.id });
        toast.success(`${user.email} has been banned`);
      }
      fetchUsers();
    } catch (error) {
      console.error("Failed to ban/unban user:", error);
      toast.error("Failed to update user status");
    }
  };

  const handleRemoveUser = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      await authClient.admin.removeUser({ userId: selectedUser.id });
      toast.success(`${selectedUser.email} has been removed`);
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Failed to remove user:", error);
      toast.error("Failed to remove user");
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case "admin":
        return "bg-red-400 text-black border-black";
      case "staff":
        return "bg-blue-400 text-black border-black";
      default:
        return "bg-gray-300 text-black border-black";
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-black dark:text-white flex items-center gap-3">
            <div className="p-2 bg-purple-400 border-2 border-black dark:border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]">
              <Shield className="w-6 h-6" />
            </div>
            User Management
          </h1>
          <p className="text-black/60 dark:text-white/60 mt-1">
            Manage user roles and permissions
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="neo-brutal neo-brutal-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-black/60 dark:text-white/60 font-medium">
              Total Users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-black dark:text-white">
              {users.length}
            </div>
          </CardContent>
        </Card>
        <Card className="neo-brutal neo-brutal-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-black/60 dark:text-white/60 font-medium">
              Admins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">
              {users.filter((u) => u.role === "admin").length}
            </div>
          </CardContent>
        </Card>
        <Card className="neo-brutal neo-brutal-white">
          <CardHeader className="pb-2">
            <CardDescription className="text-black/60 dark:text-white/60 font-medium">
              Staff
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-600">
              {users.filter((u) => u.role === "staff").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="neo-brutal neo-brutal-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Users
              </CardTitle>
              <CardDescription className="text-black/60 dark:text-white/60">
                View and manage user access
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/40" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-black dark:border-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="border-2 border-black dark:border-white">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-black dark:border-white bg-gray-100 dark:bg-gray-800">
                      <TableHead className="font-bold text-black dark:text-white">
                        User
                      </TableHead>
                      <TableHead className="font-bold text-black dark:text-white">
                        Email
                      </TableHead>
                      <TableHead className="font-bold text-black dark:text-white">
                        Role
                      </TableHead>
                      <TableHead className="font-bold text-black dark:text-white">
                        Status
                      </TableHead>
                      <TableHead className="font-bold text-black dark:text-white text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow
                        key={user.id}
                        className="border-b border-black/20 dark:border-white/20"
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="border-2 border-black dark:border-white">
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback className="bg-yellow-400 text-black font-bold">
                                {getInitials(user.name, user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-black dark:text-white">
                              {user.name || "No name"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-black/70 dark:text-white/70">
                          {user.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getRoleBadgeColor(user.role)} border-2 font-bold`}
                          >
                            {user.role || "user"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`border-2 font-bold ${
                              user.banned
                                ? "bg-red-400 text-black border-black"
                                : "bg-green-400 text-black border-black"
                            }`}
                          >
                            {user.banned ? "Banned" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="border-2 border-black dark:border-white"
                                disabled={user.id === session?.user?.id}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="border-2 border-black dark:border-white"
                            >
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRole(user.role || "user");
                                  setIsRoleDialogOpen(true);
                                }}
                              >
                                <UserCog className="w-4 h-4 mr-2" />
                                Change Role
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleBanUser(user)}
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                {user.banned ? "Unban User" : "Ban User"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Remove User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-black/60 dark:text-white/60"
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-black/60 dark:text-white/60">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="border-2 border-black dark:border-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="border-2 border-black dark:border-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="neo-brutal neo-brutal-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black dark:text-white">
              Change User Role
            </DialogTitle>
            <DialogDescription className="text-black/60 dark:text-white/60">
              Update the role for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="border-2 border-black dark:border-white">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent className="border-2 border-black dark:border-white">
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-xs text-black/60 dark:text-white/60">
                        {role.description}
                      </p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
              className="border-2 border-black dark:border-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={isUpdating}
              className="bg-blue-400 text-black border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              {isUpdating ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="neo-brutal neo-brutal-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-black dark:text-white">
              Remove User
            </DialogTitle>
            <DialogDescription className="text-black/60 dark:text-white/60">
              Are you sure you want to remove {selectedUser?.email}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-2 border-black dark:border-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRemoveUser}
              disabled={isUpdating}
              className="bg-red-400 text-black border-2 border-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              {isUpdating ? "Removing..." : "Remove User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
