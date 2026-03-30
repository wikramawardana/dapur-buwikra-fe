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
import { StatsCardSkeleton, TableSkeleton } from "@/components/ui/page-loading";
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
import { useIsMobile } from "@/hooks/use-mobile";
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
    value: "chef",
    label: "Chef",
    description: "Can manage orders",
  },
  { value: "user", label: "User", description: "No access (pending approval)" },
];

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
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
      case "chef":
        return "bg-green-400 text-black border-black";
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
    <>
      <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4">
        <Card className="neo-brutal neo-brutal-white border-2">
          <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold sm:text-2xl">
                User Management
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Manage user roles and permissions
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-3 sm:space-y-6 sm:px-6">
            {/* Stats Cards */}
            {isLoading ? (
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <StatsCardSkeleton color="blue" />
                <StatsCardSkeleton color="red" />
                <StatsCardSkeleton color="green" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <Card className="neo-brutal bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 px-2 pt-2 sm:px-6 sm:pt-6">
                    <CardDescription className="text-blue-600 font-medium text-xs sm:text-sm">
                      Total Users
                    </CardDescription>
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  </CardHeader>
                  <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6">
                    <div className="text-xl sm:text-3xl font-black text-blue-700">
                      {users.length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="neo-brutal bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                  <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 px-2 pt-2 sm:px-6 sm:pt-6">
                    <CardDescription className="text-red-600 font-medium text-xs sm:text-sm">
                      Admins
                    </CardDescription>
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  </CardHeader>
                  <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6">
                    <div className="text-xl sm:text-3xl font-black text-red-700">
                      {users.filter((u) => u.role === "admin").length}
                    </div>
                  </CardContent>
                </Card>
                <Card className="neo-brutal bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CardHeader className="pb-1 sm:pb-2 flex flex-row items-center justify-between space-y-0 px-2 pt-2 sm:px-6 sm:pt-6">
                    <CardDescription className="text-green-600 font-medium text-xs sm:text-sm">
                      Chefs
                    </CardDescription>
                    <UserCog className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </CardHeader>
                  <CardContent className="px-2 pb-2 sm:px-6 sm:pb-6">
                    <div className="text-xl sm:text-3xl font-black text-green-700">
                      {users.filter((u) => u.role === "chef").length}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users Table Card */}
            <Card className="neo-brutal neo-brutal-white">
              <CardHeader className="px-3 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold text-black dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                      Users
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                      View and manage user access
                    </CardDescription>
                  </div>
                  <div className="relative w-full sm:w-64">
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
              <CardContent className="px-3 sm:px-6">
                {isLoading ? (
                  <TableSkeleton rows={5} columns={isMobile ? 2 : 5} />
                ) : (
                  <>
                    {/* Mobile Card View */}
                    {isMobile ? (
                      <div className="space-y-3">
                        {filteredUsers.map((user) => (
                          <Card
                            key={user.id}
                            className="border-2 border-black dark:border-white"
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <Avatar className="border-2 border-black dark:border-white h-8 w-8 flex-shrink-0">
                                    <AvatarImage
                                      src={user.image || undefined}
                                    />
                                    <AvatarFallback className="bg-yellow-400 text-black font-bold text-xs">
                                      {getInitials(user.name, user.email)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0">
                                    <p className="font-medium text-black dark:text-white text-sm truncate">
                                      {user.name || "No name"}
                                    </p>
                                    <p className="text-xs text-black/60 dark:text-white/60 truncate">
                                      {user.email}
                                    </p>
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="border-2 border-black dark:border-white h-8 w-8 flex-shrink-0"
                                      disabled={user.id === session?.user?.id}
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="border-2 border-black dark:border-white"
                                  >
                                    <DropdownMenuLabel>
                                      Actions
                                    </DropdownMenuLabel>
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
                              </div>
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge
                                  className={`${getRoleBadgeColor(user.role)} border-2 font-bold text-xs`}
                                >
                                  {user.role || "user"}
                                </Badge>
                                <Badge
                                  className={`border-2 font-bold text-xs ${
                                    user.banned
                                      ? "bg-red-400 text-black border-black"
                                      : "bg-green-400 text-black border-black"
                                  }`}
                                >
                                  {user.banned ? "Banned" : "Active"}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {filteredUsers.length === 0 && (
                          <div className="text-center py-8 text-black/60 dark:text-white/60">
                            No users found
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Desktop Table View */
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
                                      <AvatarImage
                                        src={user.image || undefined}
                                      />
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
                                      <DropdownMenuLabel>
                                        Actions
                                      </DropdownMenuLabel>
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
                                        {user.banned
                                          ? "Unban User"
                                          : "Ban User"}
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
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex flex-col gap-2 mt-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs sm:text-sm text-black/60 dark:text-white/60">
                          Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
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
          </CardContent>
        </Card>
      </div>

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
    </>
  );
}
