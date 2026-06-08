import { useLocation, Link } from "wouter";
import { Home, MapPin, Map, User } from "lucide-react";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { path: "/m", icon: Home, label: "หน้าหลัก" },
  { path: "/m/checkin", icon: MapPin, label: "เช็คอิน" },
  { path: "/m/map", icon: Map, label: "แผนที่" },
  { path: "/m/profile", icon: User, label: "โปรไฟล์" },
];

export default function MobileLayout({ children, title }: MobileLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto">
      {/* Header */}
      {title && (
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        </header>
      )}

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t max-w-md mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <button className={`flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-primary bg-primary/10 scale-105"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                  <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
