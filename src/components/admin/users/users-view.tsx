"use client";

import * as React from "react";
import { useState } from "react";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Users,
  Search,
  UserPlus,
  KeyRound,
  Shield,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  Lock,
} from "lucide-react";
import { UserRoleCode, UserStatus } from "@prisma/client";

export function UsersView() {
  const [search, setSearch] = useState("");
  const [roleCode, setRoleCode] = useState<UserRoleCode | "ALL">("ALL");
  const [status, setStatus] = useState<UserStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [resetPwdUser, setResetPwdUser] = useState<any | null>(null);

  // Create form states
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRoleCode, setNewRoleCode] = useState<UserRoleCode>(UserRoleCode.COUNSELOR);
  const [newPassword, setNewPassword] = useState("SoftLab@2026!");
  const [newDepartment, setNewDepartment] = useState("ADMISSIONS");

  // Edit form states
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRoleCode, setEditRoleCode] = useState<UserRoleCode>(UserRoleCode.COUNSELOR);
  const [editStatus, setEditStatus] = useState<UserStatus>(UserStatus.ACTIVE);

  // Reset password state
  const [newPasswordValue, setNewPasswordValue] = useState("");

  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const utils = api.useUtils();

  const { data, isLoading } = api.admin.listUsers.useQuery({
    search: search.trim() || undefined,
    roleCode: roleCode === "ALL" ? undefined : roleCode,
    status: status === "ALL" ? undefined : status,
    page,
    pageSize: 15,
  });

  const users = data?.users || [];
  const pagination = {
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || 15,
    totalPages: data?.totalPages || 1,
  };

  const createMutation = api.admin.createUser.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "New user account created successfully!" });
      setCreateOpen(false);
      resetCreateForm();
      utils.admin.listUsers.invalidate();
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to create user." });
    },
  });

  const updateMutation = api.admin.updateUser.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "User account updated successfully!" });
      setEditUser(null);
      utils.admin.listUsers.invalidate();
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to update user." });
    },
  });

  const resetPasswordMutation = api.admin.resetPassword.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "Password reset successfully!" });
      setResetPwdUser(null);
      setNewPasswordValue("");
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to reset password." });
    },
  });

  const toggleStatusMutation = api.admin.toggleUserStatus.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "User status updated successfully!" });
      utils.admin.listUsers.invalidate();
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to update status." });
    },
  });

  const deleteMutation = api.admin.deleteUser.useMutation({
    onSuccess: () => {
      setNotification({ type: "success", message: "User account deleted." });
      utils.admin.listUsers.invalidate();
      setTimeout(() => setNotification(null), 4000);
    },
    onError: (err) => {
      setNotification({ type: "error", message: err.message || "Failed to delete user." });
    },
  });

  const resetCreateForm = () => {
    setNewFirstName("");
    setNewLastName("");
    setNewEmail("");
    setNewPhone("");
    setNewRoleCode(UserRoleCode.COUNSELOR);
    setNewPassword("SoftLab@2026!");
    setNewDepartment("ADMISSIONS");
  };

  const handleOpenEdit = (user: any) => {
    setEditUser(user);
    setEditFirstName(user.firstName);
    setEditLastName(user.lastName);
    setEditEmail(user.email);
    setEditPhone(user.phone || "");
    setEditRoleCode(user.roleCode);
    setEditStatus(user.status);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      firstName: newFirstName,
      lastName: newLastName,
      email: newEmail,
      phone: newPhone,
      roleCode: newRoleCode,
      password: newPassword,
      department: newDepartment,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    updateMutation.mutate({
      id: editUser.id,
      firstName: editFirstName,
      lastName: editLastName,
      email: editEmail,
      phone: editPhone,
      roleCode: editRoleCode,
      status: editStatus,
    });
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdUser || !newPasswordValue) return;
    resetPasswordMutation.mutate({
      userId: resetPwdUser.id,
      newPassword: newPasswordValue,
    });
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div
          className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Control Bar */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search user by name, email, phone..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <UserPlus className="h-4 w-4" />
              <span>Create New User</span>
            </Button>
          </div>

          {/* Role Filters */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              onClick={() => {
                setRoleCode("ALL");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                roleCode === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Roles
            </button>
            {Object.values(UserRoleCode).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRoleCode(r);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  roleCode === r
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3">User / Identity</th>
                <th className="p-3">Role & Permissions</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Status</th>
                <th className="p-3">Last Login</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No users found matching query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-slate-500 text-[11px] font-mono">{u.email}</p>
                      {u.studentId && (
                        <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                          {u.studentId}
                        </span>
                      )}
                      {u.employeeId && (
                        <span className="text-[10px] text-sky-700 font-mono font-bold bg-sky-50 px-1.5 py-0.5 rounded">
                          {u.employeeId} ({u.department})
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="font-mono text-[11px] font-bold">
                        {u.roleCode}
                      </Badge>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {u.permissionsCount} permissions
                      </p>
                    </td>
                    <td className="p-3 text-slate-600">
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{u.phone || "—"}</span>
                      </p>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800"
                            : u.status === "INACTIVE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500 text-[11px]">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          onClick={() => handleOpenEdit(u)}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          title="Edit User"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => setResetPwdUser(u)}
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-sky-700"
                          title="Reset Password"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        {u.roleCode !== "SUPER_ADMIN" && (
                          <Button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete user ${u.name}?`)) {
                                deleteMutation.mutate({ userId: u.id });
                              }
                            }}
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {users.length} of {pagination.total} users
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-7 px-2"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="h-7 px-2"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* CREATE USER MODAL */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white border-slate-200 shadow-lg">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-emerald-600" />
                Create New Platform User
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleCreateSubmit}>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">First Name</Label>
                    <Input
                      required
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Last Name</Label>
                    <Input
                      required
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Email Address</Label>
                    <Input
                      required
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Phone Number</Label>
                    <Input
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Platform Role</Label>
                    <select
                      value={newRoleCode}
                      onChange={(e) => setNewRoleCode(e.target.value as UserRoleCode)}
                      className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white"
                    >
                      {Object.values(UserRoleCode).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Initial Password</Label>
                    <Input
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-8 text-xs font-mono mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={createMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Account"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg bg-white border-slate-200 shadow-lg">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-emerald-600" />
                Edit User: {editUser.name}
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleEditSubmit}>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">First Name</Label>
                    <Input
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Last Name</Label>
                    <Input
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Email</Label>
                    <Input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Phone</Label>
                    <Input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Role</Label>
                    <select
                      value={editRoleCode}
                      onChange={(e) => setEditRoleCode(e.target.value as UserRoleCode)}
                      disabled={editUser.roleCode === "SUPER_ADMIN"}
                      className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white"
                    >
                      {Object.values(UserRoleCode).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Account Status</Label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                      disabled={editUser.roleCode === "SUPER_ADMIN"}
                      className="w-full h-8 text-xs mt-1 rounded-md border border-slate-300 px-2 bg-white"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditUser(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={updateMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPwdUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm bg-white border-slate-200 shadow-lg">
            <CardHeader className="p-4 border-b border-slate-100">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-sky-600" />
                Reset Password: {resetPwdUser.name}
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleResetPasswordSubmit}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-xs font-semibold">New Secure Password</Label>
                  <Input
                    required
                    type="text"
                    placeholder="Enter at least 6 characters"
                    value={newPasswordValue}
                    onChange={(e) => setNewPasswordValue(e.target.value)}
                    className="h-8 text-xs font-mono mt-1"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setResetPwdUser(null)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={resetPasswordMutation.isPending}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Update Password"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
