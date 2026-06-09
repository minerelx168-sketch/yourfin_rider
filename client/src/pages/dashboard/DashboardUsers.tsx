import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, UserPlus, KeyRound, Ban, CheckCircle2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";

type Role = "sales" | "manager" | "admin";

const ROLE_LABELS: Record<string, string> = {
  admin: "ผู้ดูแลระบบ",
  manager: "ผู้จัดการ",
  sales: "พนักงานขาย",
  user: "ผู้ใช้",
};

const emptyForm = {
  username: "",
  password: "",
  name: "",
  role: "sales" as Role,
  phone: "",
  team: "",
  region: "",
};

export default function DashboardUsers() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";

  const [form, setForm] = useState(emptyForm);
  const [resetTarget, setResetTarget] = useState<{ id: number; name: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const usersQuery = trpc.users.list.useQuery(undefined, { enabled: isAuthenticated });

  const createMutation = trpc.users.create.useMutation({
    onSuccess: async () => {
      toast.success("สร้างบัญชีสำเร็จ");
      setForm(emptyForm);
      await utils.users.list.invalidate();
    },
    onError: err => toast.error(err.message || "สร้างบัญชีไม่สำเร็จ"),
  });

  const resetMutation = trpc.users.resetPassword.useMutation({
    onSuccess: async () => {
      toast.success("รีเซ็ตรหัสผ่านสำเร็จ");
      setResetTarget(null);
      setNewPassword("");
      await utils.users.list.invalidate();
    },
    onError: err => toast.error(err.message || "รีเซ็ตรหัสผ่านไม่สำเร็จ"),
  });

  const activeMutation = trpc.users.setActive.useMutation({
    onSuccess: async () => {
      await utils.users.list.invalidate();
    },
    onError: err => toast.error(err.message || "อัปเดตสถานะไม่สำเร็จ"),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const roleOptions: Role[] = isAdmin ? ["sales", "manager", "admin"] : ["sales"];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      username: form.username.trim(),
      password: form.password,
      name: form.name.trim(),
      role: form.role,
      phone: form.phone.trim() || undefined,
      team: form.team.trim() || undefined,
      region: form.region.trim() || undefined,
    });
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    resetMutation.mutate({ userId: resetTarget.id, newPassword });
  };

  const users = usersQuery.data ?? [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการผู้ใช้งาน</h1>
          <p className="text-sm text-muted-foreground">
            สร้างบัญชีและตั้งชื่อผู้ใช้/รหัสผ่านให้พนักงานได้โดยตรง
            {isAdmin ? " (ผู้ดูแลระบบ)" : " — ผู้จัดการสร้างได้เฉพาะบัญชีพนักงานขาย"}
          </p>
        </div>

        {/* Create account form */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> สร้างบัญชีใหม่
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="c-username">ชื่อผู้ใช้ (username) *</Label>
                <Input id="c-username" autoComplete="off" placeholder="เช่น somchai"
                  value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-password">รหัสผ่าน *</Label>
                <Input id="c-password" type="text" autoComplete="off" placeholder="อย่างน้อย 6 ตัวอักษร"
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-name">ชื่อ-นามสกุล *</Label>
                <Input id="c-name" placeholder="เช่น สมชาย ใจดี"
                  value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>บทบาท</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as Role }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(r => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-team">ทีม</Label>
                <Input id="c-team" placeholder="เช่น ทีมกรุงเทพฯ"
                  value={form.team} onChange={e => setForm(f => ({ ...f, team: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-region">พื้นที่</Label>
                <Input id="c-region" placeholder="เช่น ภาคกลาง"
                  value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-phone">เบอร์โทร</Label>
                <Input id="c-phone" placeholder="08x-xxx-xxxx"
                  value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="flex items-end lg:col-span-2">
                <Button type="submit" className="w-full sm:w-auto" disabled={createMutation.isPending}>
                  {createMutation.isPending
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <><UserPlus className="w-4 h-4 mr-2" /> สร้างบัญชี</>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Users table */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">รายชื่อผู้ใช้งาน ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ชื่อ</TableHead>
                      <TableHead>ชื่อผู้ใช้</TableHead>
                      <TableHead>บทบาท</TableHead>
                      <TableHead>ทีม / พื้นที่</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(u => {
                      const canManage = isAdmin || u.role === "sales";
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name || "-"}</TableCell>
                          <TableCell>
                            {u.username
                              ? <span className="font-mono text-sm">{u.username}</span>
                              : <span className="text-xs text-muted-foreground">Manus / OAuth</span>}
                          </TableCell>
                          <TableCell>
                            <Badge variant={u.role === "admin" ? "default" : u.role === "manager" ? "secondary" : "outline"}>
                              {ROLE_LABELS[u.role] ?? u.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {[u.team, u.region].filter(Boolean).join(" / ") || "-"}
                          </TableCell>
                          <TableCell>
                            {u.active
                              ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> ใช้งาน</span>
                              : <span className="inline-flex items-center gap-1 text-xs text-destructive"><Ban className="w-3.5 h-3.5" /> ระงับ</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {u.username && canManage ? (
                              <div className="flex items-center justify-end gap-2">
                                <Button size="sm" variant="outline"
                                  onClick={() => { setResetTarget({ id: u.id, name: u.name || u.username! }); setNewPassword(""); }}>
                                  <KeyRound className="w-3.5 h-3.5 mr-1" /> รีเซ็ตรหัส
                                </Button>
                                <Button size="sm" variant={u.active ? "outline" : "default"}
                                  disabled={activeMutation.isPending || u.id === user?.id}
                                  onClick={() => activeMutation.mutate({ userId: u.id, active: !u.active })}>
                                  {u.active ? "ระงับ" : "เปิดใช้"}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                          ยังไม่มีผู้ใช้งาน
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reset password dialog */}
      <Dialog open={!!resetTarget} onOpenChange={open => { if (!open) setResetTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>รีเซ็ตรหัสผ่าน — {resetTarget?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
              <Input id="new-password" type="text" autoComplete="off" placeholder="อย่างน้อย 6 ตัวอักษร"
                value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={resetMutation.isPending || newPassword.length < 6}>
                {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "บันทึกรหัสผ่านใหม่"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
