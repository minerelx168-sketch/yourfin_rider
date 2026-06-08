import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, LogOut, User, Phone, Mail, MapPin } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function MobileProfile() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) {
    return (
      <MobileLayout title="โปรไฟล์">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  const initials = (user?.name || "U").slice(0, 2).toUpperCase();

  return (
    <MobileLayout title="โปรไฟล์">
      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <Avatar className="w-20 h-20 mb-3">
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-bold text-foreground">{user?.name || "พนักงาน"}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium mt-1">
              {user?.role === "sales" ? "เซลล์ไรเดอร์" :
               user?.role === "manager" ? "ผู้จัดการ" :
               user?.role === "admin" ? "ผู้ดูแลระบบ" : "พนักงาน"}
            </span>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="border shadow-sm">
          <CardContent className="p-4 space-y-4">
            {user?.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{user.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">ID: {user?.id}</span>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/5"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          ออกจากระบบ
        </Button>
      </div>
    </MobileLayout>
  );
}
