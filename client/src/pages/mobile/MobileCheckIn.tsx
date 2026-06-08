import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Camera, MapPin, Send } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useState, useRef } from "react";
import { toast } from "sonner";

const BRANDS = [
  { value: "SAMSUNG", label: "Samsung" },
  { value: "VIVO", label: "Vivo" },
  { value: "OPPO", label: "Oppo" },
  { value: "XIAOMI", label: "Xiaomi" },
  { value: "REALME", label: "Realme" },
  { value: "APPLE", label: "Apple" },
  { value: "OTHER", label: "อื่นๆ" },
] as const;

const VISIT_STATUSES = [
  { value: "SUCCESS", label: "สำเร็จ", color: "bg-green-100 text-green-700" },
  { value: "PENDING", label: "รอตัดสินใจ", color: "bg-gray-100 text-gray-700" },
  { value: "REJECTED", label: "ปฏิเสธ", color: "bg-orange-100 text-orange-700" },
] as const;

export default function MobileCheckIn() {
  const { loading, isAuthenticated } = useAuth();
  const [storeName, setStoreName] = useState("");
  const [brand, setBrand] = useState<string>("");
  const [visitStatus, setVisitStatus] = useState<string>("");
  const [note, setNote] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.upload.photo.useMutation();
  const checkInMutation = trpc.activity.checkIn.useMutation({
    onSuccess: (data) => {
      toast.success(`เช็คอินสำเร็จ! ระยะทาง ${data.legDistanceKm.toFixed(1)} กม.`);
      // Reset form
      setStoreName("");
      setBrand("");
      setVisitStatus("");
      setNote("");
      setPhotoPreview(null);
      setPhotoBase64(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPhotoPreview(result);
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64 = result.split(",")[1];
      setPhotoBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!storeName || !brand || !visitStatus) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setSubmitting(true);

    try {
      // Get GPS
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;

      // Upload photo if exists
      let photoUrl: string | undefined;
      if (photoBase64) {
        const uploadResult = await uploadMutation.mutateAsync({
          fileName: `checkin-${Date.now()}.jpg`,
          base64Data: photoBase64,
          contentType: "image/jpeg",
        });
        photoUrl = uploadResult.url;
      }

      // Submit check-in
      await checkInMutation.mutateAsync({
        lat,
        lng,
        storeName,
        brand: brand as any,
        visitStatus: visitStatus as any,
        photoUrl,
        note: note || undefined,
      });
    } catch (err: any) {
      if (err.code === 1) {
        toast.error("กรุณาอนุญาตการเข้าถึง GPS");
      } else {
        toast.error(err.message || "เกิดข้อผิดพลาด");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout title="เช็คอินร้านค้า">
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

  return (
    <MobileLayout title="เช็คอินร้านค้า">
      <div className="p-4 space-y-4">
        {/* GPS indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-green-500" />
          <span>จะจับพิกัด GPS อัตโนมัติเมื่อส่งฟอร์ม</span>
        </div>

        {/* Store Name */}
        <div className="space-y-2">
          <Label htmlFor="storeName">ชื่อร้าน *</Label>
          <Input
            id="storeName"
            placeholder="กรอกชื่อร้านค้า"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
        </div>

        {/* Brand */}
        <div className="space-y-2">
          <Label>แบรนด์ *</Label>
          <Select value={brand} onValueChange={setBrand}>
            <SelectTrigger>
              <SelectValue placeholder="เลือกแบรนด์" />
            </SelectTrigger>
            <SelectContent>
              {BRANDS.map((b) => (
                <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Visit Status */}
        <div className="space-y-2">
          <Label>สถานะการเข้าพบ *</Label>
          <div className="grid grid-cols-3 gap-2">
            {VISIT_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setVisitStatus(s.value)}
                className={`p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                  visitStatus === s.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Photo */}
        <div className="space-y-2">
          <Label>รูปหน้าร้าน</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoCapture}
          />
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  setPhotoPreview(null);
                  setPhotoBase64(null);
                }}
              >
                ลบรูป
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full h-32 flex flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">ถ่ายรูป / เลือกรูป</span>
            </Button>
          )}
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note">หมายเหตุ</Label>
          <Textarea
            id="note"
            placeholder="บันทึกเพิ่มเติม (ถ้ามี)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
          />
        </div>

        {/* Submit */}
        <Button
          className="w-full h-12 text-base font-medium"
          onClick={handleSubmit}
          disabled={submitting || !storeName || !brand || !visitStatus}
        >
          {submitting ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Send className="w-5 h-5 mr-2" />
          )}
          บันทึกเช็คอิน
        </Button>
      </div>
    </MobileLayout>
  );
}
