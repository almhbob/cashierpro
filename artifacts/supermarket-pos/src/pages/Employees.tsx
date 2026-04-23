import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import {
  Users, UserPlus, Shield, Search, Phone, Mail, DollarSign,
  Calendar, Edit2, Trash2, UserCheck, UserX, KeyRound, Eye,
  EyeOff, AlertCircle, CheckCircle2, Clock, MoreVertical,
  Briefcase, Building2, BarChart3, RefreshCw, Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ────────────────────────────
   TYPES
──────────────────────────── */
interface Employee {
  id: string;
  tenantId: string;
  name: string;
  nameEn: string;
  role: "owner" | "manager" | "cashier" | "accountant" | "warehouse";
  pin: string | null;
  phone: string;
  email: string;
  salary: number | null;
  salaryType: string;
  startDate: string | null;
  nationalId: string;
  notes: string;
  status: "active" | "inactive" | "suspended";
  canManageProducts: boolean;
  canManageSales: boolean;
  canViewReports: boolean;
  canManageEmployees: boolean;
  canManageSettings: boolean;
  canApplyDiscount: boolean;
  maxDiscountPercent: number;
  createdAt: string;
}

interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
  totalSalary: number;
}

/* ────────────────────────────
   CONSTANTS
──────────────────────────── */
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  owner: { label: "مالك", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Shield },
  manager: { label: "مدير", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Briefcase },
  cashier: { label: "كاشير", color: "text-teal-700", bg: "bg-teal-50 border-teal-200", icon: Users },
  accountant: { label: "محاسب", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: BarChart3 },
  warehouse: { label: "مستودع", color: "text-slate-700", bg: "bg-slate-50 border-slate-200", icon: Building2 },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: "نشط", color: "text-green-700 bg-green-50 border-green-200", dot: "bg-green-500" },
  inactive: { label: "غير نشط", color: "text-slate-600 bg-slate-50 border-slate-200", dot: "bg-slate-400" },
  suspended: { label: "موقوف", color: "text-red-700 bg-red-50 border-red-200", dot: "bg-red-500" },
};

interface EmployeeFormData {
  name: string; nameEn: string;
  role: "owner" | "manager" | "cashier" | "accountant" | "warehouse";
  pin: string; phone: string; email: string; salary: string;
  salaryType: string; startDate: string; nationalId: string; notes: string;
  status: "active" | "inactive" | "suspended";
  canManageProducts: boolean; canManageSales: boolean; canViewReports: boolean;
  canManageEmployees: boolean; canManageSettings: boolean; canApplyDiscount: boolean;
  maxDiscountPercent: number;
}

const DEFAULT_FORM: EmployeeFormData = {
  name: "", nameEn: "", role: "cashier", pin: "", phone: "", email: "",
  salary: "", salaryType: "monthly", startDate: "", nationalId: "", notes: "",
  status: "active",
  canManageProducts: false, canManageSales: true, canViewReports: false,
  canManageEmployees: false, canManageSettings: false, canApplyDiscount: false,
  maxDiscountPercent: 0,
};

/* ────────────────────────────
   SUPERVISOR LOCK
──────────────────────────── */
function SupervisorLock({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const verify = async () => {
    if (!pin) { setError("أدخل رمز المشرف"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/employees/verify-supervisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.verified) {
        toast({ title: `مرحباً ${data.employee.name}`, description: "تم التحقق من صلاحية المشرف" });
        onUnlock();
      } else {
        setError("رمز PIN غير صحيح أو ليس لديك صلاحية مشرف");
      }
    } catch {
      setError("فشل في التحقق، تحقق من الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="text-center space-y-3">
        <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mx-auto">
          <Lock className="h-9 w-9 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold">صفحة محمية</h2>
        <p className="text-muted-foreground text-sm max-w-xs">
          إدارة الموظفين متاحة للمشرفين فقط. أدخل رمز PIN الخاص بك للمتابعة.
        </p>
      </div>

      <Card className="w-full max-w-sm">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>رمز PIN المشرف</Label>
            <Input
              type="password"
              placeholder="••••"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              className="text-center text-2xl tracking-widest h-14"
              maxLength={8}
            />
            {error && (
              <p className="text-red-500 text-xs flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />{error}
              </p>
            )}
          </div>
          <Button onClick={verify} disabled={loading} className="w-full h-11 gap-2">
            <KeyRound className="h-4 w-4" />
            {loading ? "جاري التحقق..." : "تحقق من الصلاحية"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/* ────────────────────────────
   EMPLOYEE FORM
──────────────────────────── */
function EmployeeForm({
  initial, onSave, onClose, loading,
}: {
  initial: typeof DEFAULT_FORM;
  onSave: (data: typeof DEFAULT_FORM) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState(initial);
  const [showPin, setShowPin] = useState(false);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  const handleRoleChange = (role: string) => {
    const defaults = {
      owner: { canManageProducts: true, canManageSales: true, canViewReports: true, canManageEmployees: true, canManageSettings: true, canApplyDiscount: true, maxDiscountPercent: 100 },
      manager: { canManageProducts: true, canManageSales: true, canViewReports: true, canManageEmployees: true, canManageSettings: false, canApplyDiscount: true, maxDiscountPercent: 50 },
      cashier: { canManageProducts: false, canManageSales: true, canViewReports: false, canManageEmployees: false, canManageSettings: false, canApplyDiscount: false, maxDiscountPercent: 0 },
      accountant: { canManageProducts: false, canManageSales: false, canViewReports: true, canManageEmployees: false, canManageSettings: false, canApplyDiscount: false, maxDiscountPercent: 0 },
      warehouse: { canManageProducts: true, canManageSales: false, canViewReports: false, canManageEmployees: false, canManageSettings: false, canApplyDiscount: false, maxDiscountPercent: 0 },
    };
    setForm((f) => ({ ...f, role: role as any, ...(defaults[role as keyof typeof defaults] || {}) }));
  };

  const permItems = [
    { key: "canManageSales", label: "إجراء عمليات البيع", desc: "الوصول لنقطة البيع" },
    { key: "canManageProducts", label: "إدارة المنتجات", desc: "إضافة وتعديل وحذف المنتجات" },
    { key: "canViewReports", label: "عرض التقارير", desc: "الوصول للتحليلات والتقارير" },
    { key: "canManageEmployees", label: "إدارة الموظفين", desc: "إضافة وتعديل بيانات الموظفين" },
    { key: "canManageSettings", label: "تعديل الإعدادات", desc: "تغيير إعدادات النظام" },
    { key: "canApplyDiscount", label: "تطبيق خصومات", desc: "منح خصومات على المشتريات" },
  ] as const;

  return (
    <div className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>الاسم (عربي) <span className="text-red-500">*</span></Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="محمد أحمد" />
        </div>
        <div className="space-y-1.5">
          <Label>الاسم (إنجليزي)</Label>
          <Input value={form.nameEn} onChange={(e) => set("nameEn", e.target.value)} placeholder="Mohammed Ahmed" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>الدور الوظيفي <span className="text-red-500">*</span></Label>
          <Select value={form.role} onValueChange={handleRoleChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    <cfg.icon className="h-4 w-4" />
                    {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>الحالة</Label>
          <Select value={form.status} onValueChange={(v) => set("status", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
              <SelectItem value="suspended">موقوف</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* PIN */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
          رمز PIN للدخول
        </Label>
        <div className="relative">
          <Input
            type={showPin ? "text" : "password"}
            value={form.pin}
            onChange={(e) => set("pin", e.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="4-8 أرقام"
            className="pe-10 tracking-widest"
          />
          <button
            type="button"
            className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground"
            onClick={() => setShowPin(!showPin)}
          >
            {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">اتركه فارغاً إذا لم تحتاج PIN للدخول السريع</p>
      </div>

      {/* Contact Info */}
      <Separator />
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">معلومات التواصل</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />رقم الهاتف</Label>
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="05xxxxxxxx" />
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />البريد الإلكتروني</Label>
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="example@email.com" />
        </div>
      </div>

      {/* Employment Info */}
      <Separator />
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">التوظيف والراتب</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" />الراتب</Label>
          <Input type="number" value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label>نوع الراتب</Label>
          <Select value={form.salaryType} onValueChange={(v) => set("salaryType", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">شهري</SelectItem>
              <SelectItem value="weekly">أسبوعي</SelectItem>
              <SelectItem value="daily">يومي</SelectItem>
              <SelectItem value="hourly">بالساعة</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />تاريخ التعيين</Label>
          <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>رقم الهوية / الإقامة</Label>
        <Input value={form.nationalId} onChange={(e) => set("nationalId", e.target.value)} placeholder="1xxxxxxxxx" />
      </div>

      {/* Permissions */}
      <Separator />
      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">الصلاحيات</p>
      <div className="space-y-3">
        {permItems.map((perm) => (
          <div key={perm.key} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div>
              <p className="text-sm font-medium">{perm.label}</p>
              <p className="text-xs text-muted-foreground">{perm.desc}</p>
            </div>
            <Switch
              checked={form[perm.key] as boolean}
              onCheckedChange={(v) => set(perm.key, v)}
            />
          </div>
        ))}
        {form.canApplyDiscount && (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-amber-50/50">
            <Label className="whitespace-nowrap text-sm">أقصى خصم مسموح (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={form.maxDiscountPercent}
              onChange={(e) => set("maxDiscountPercent", Number(e.target.value))}
              className="w-24 h-8"
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label>ملاحظات</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="أي ملاحظات إضافية..."
          rows={2}
        />
      </div>

      <DialogFooter className="pt-2 gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>إلغاء</Button>
        <Button onClick={() => onSave(form)} disabled={loading || !form.name} className="gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          {loading ? "جاري الحفظ..." : "حفظ البيانات"}
        </Button>
      </DialogFooter>
    </div>
  );
}

/* ────────────────────────────
   AVATAR COMPONENT
──────────────────────────── */
function EmployeeAvatar({ name, role }: { name: string; role: string }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.cashier;
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("");
  return (
    <div className={cn("w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0", cfg.bg, cfg.color)}>
      {initials}
    </div>
  );
}

/* ────────────────────────────
   MAIN PAGE
──────────────────────────── */
export default function EmployeesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [unlocked, setUnlocked] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  /* ── Queries ── */
  const { data: employees = [], isLoading, refetch } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch("/api/employees");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: unlocked,
  });

  const { data: stats } = useQuery<EmployeeStats>({
    queryKey: ["employees", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/employees/stats");
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: unlocked,
  });

  /* ── Mutations ── */
  const createMutation = useMutation({
    mutationFn: async (data: typeof DEFAULT_FORM) => {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "تم إضافة الموظف بنجاح" });
      setShowAdd(false);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof DEFAULT_FORM }) => {
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: "تم تحديث بيانات الموظف" });
      setEditEmployee(null);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, permanent }: { id: string; permanent: boolean }) => {
      const res = await fetch(`/api/employees/${id}?permanent=${permanent}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: vars.permanent ? "تم حذف الموظف نهائياً" : "تم إيقاف تفعيل الموظف" });
      setDeleteId(null);
      setDeleteEmployee(null);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  /* ── Filter ── */
  const filtered = employees.filter((e) => {
    const matchSearch = !search || e.name.includes(search) || e.phone.includes(search) || e.email.includes(search);
    const matchRole = filterRole === "all" || e.role === filterRole;
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  if (!unlocked) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">إدارة الموظفين</h1>
            <p className="text-muted-foreground mt-1">إدارة فريق العمل والصلاحيات</p>
          </div>
        </div>
        <SupervisorLock onUnlock={() => setUnlocked(true)} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">إدارة الموظفين</h1>
            <p className="text-muted-foreground mt-1">إدارة فريق العمل وصلاحياتهم</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            إضافة موظف
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-xs text-blue-600 font-medium">إجمالي الموظفين</p>
              <p className="text-3xl font-black text-blue-700 mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
            <CardContent className="p-4">
              <p className="text-xs text-green-600 font-medium">نشطون</p>
              <p className="text-3xl font-black text-green-700 mt-1">{stats.active}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
            <CardContent className="p-4">
              <p className="text-xs text-amber-600 font-medium">كاشيرين</p>
              <p className="text-3xl font-black text-amber-700 mt-1">{stats.byRole.cashier || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
            <CardContent className="p-4">
              <p className="text-xs text-purple-600 font-medium">مدراء</p>
              <p className="text-3xl font-black text-purple-700 mt-1">{stats.byRole.manager || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-teal-50 to-teal-100/50 border-teal-200">
            <CardContent className="p-4">
              <p className="text-xs text-teal-600 font-medium">إجمالي الرواتب</p>
              <p className="text-lg font-black text-teal-700 mt-1">
                {stats.totalSalary.toLocaleString("ar-SA", { minimumFractionDigits: 0 })} ر.س
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
              <Input
                className="ps-9 h-9"
                placeholder="ابحث بالاسم أو الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="كل الأدوار" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الأدوار</SelectItem>
                {Object.entries(ROLE_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
                <SelectItem value="suspended">موقوف</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="h-9 px-3 text-sm font-medium">
              {filtered.length} موظف
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> قائمة الموظفين
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium">لا يوجد موظفون</p>
              <p className="text-sm text-muted-foreground">أضف أول موظف في فريق العمل</p>
              <Button onClick={() => setShowAdd(true)} className="mt-2 gap-2">
                <UserPlus className="h-4 w-4" /> إضافة موظف
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((emp) => {
                const roleCfg = ROLE_CONFIG[emp.role] || ROLE_CONFIG.cashier;
                const statusCfg = STATUS_CONFIG[emp.status] || STATUS_CONFIG.active;
                const RoleIcon = roleCfg.icon;
                return (
                  <div key={emp.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                    <EmployeeAvatar name={emp.name} role={emp.role} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800">{emp.name}</p>
                        <Badge className={cn("text-xs border", roleCfg.bg, roleCfg.color)}>
                          <RoleIcon className="h-3 w-3 me-1" />
                          {roleCfg.label}
                        </Badge>
                        <Badge className={cn("text-xs border", statusCfg.color)}>
                          <span className={cn("w-1.5 h-1.5 rounded-full me-1.5 inline-block", statusCfg.dot)} />
                          {statusCfg.label}
                        </Badge>
                        {emp.pin && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <KeyRound className="h-2.5 w-2.5" /> PIN
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        {emp.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{emp.phone}</span>}
                        {emp.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{emp.email}</span>}
                        {emp.salary && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {emp.salary.toLocaleString("ar-SA")} ر.س / {emp.salaryType === "monthly" ? "شهري" : emp.salaryType === "weekly" ? "أسبوعي" : emp.salaryType === "daily" ? "يومي" : "بالساعة"}
                          </span>
                        )}
                        {emp.startDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(emp.startDate).toLocaleDateString("ar-SA")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Permissions Mini-Badges */}
                    <div className="hidden lg:flex items-center gap-1 flex-wrap max-w-[180px]">
                      {emp.canManageSales && <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">بيع</span>}
                      {emp.canManageProducts && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">منتجات</span>}
                      {emp.canViewReports && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">تقارير</span>}
                      {emp.canApplyDiscount && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">خصم {emp.maxDiscountPercent}%</span>}
                      {emp.canManageSettings && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">إعدادات</span>}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => setEditEmployee(emp)}
                          className="gap-2"
                        >
                          <Edit2 className="h-4 w-4" /> تعديل البيانات
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {emp.status === "active" ? (
                          <DropdownMenuItem
                            onClick={() => deleteMutation.mutate({ id: emp.id, permanent: false })}
                            className="gap-2 text-amber-600 focus:text-amber-600"
                          >
                            <UserX className="h-4 w-4" /> إيقاف التفعيل
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => updateMutation.mutate({ id: emp.id, data: { ...emp, salary: emp.salary?.toString() || "", status: "active" } as any })}
                            className="gap-2 text-green-600 focus:text-green-600"
                          >
                            <UserCheck className="h-4 w-4" /> إعادة التفعيل
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => { setDeleteId(emp.id); setDeleteEmployee(emp); }}
                          className="gap-2 text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" /> حذف نهائي
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-600" />
              إضافة موظف جديد
            </DialogTitle>
          </DialogHeader>
          <EmployeeForm
            initial={DEFAULT_FORM}
            onSave={(data) => createMutation.mutate(data)}
            onClose={() => setShowAdd(false)}
            loading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editEmployee && (
        <Dialog open={!!editEmployee} onOpenChange={(v) => !v && setEditEmployee(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                تعديل بيانات: {editEmployee.name}
              </DialogTitle>
            </DialogHeader>
            <EmployeeForm
              initial={{
                name: editEmployee.name,
                nameEn: editEmployee.nameEn,
                role: editEmployee.role,
                pin: "",
                phone: editEmployee.phone,
                email: editEmployee.email,
                salary: editEmployee.salary?.toString() || "",
                salaryType: editEmployee.salaryType,
                startDate: editEmployee.startDate || "",
                nationalId: editEmployee.nationalId,
                notes: editEmployee.notes,
                status: editEmployee.status,
                canManageProducts: editEmployee.canManageProducts,
                canManageSales: editEmployee.canManageSales,
                canViewReports: editEmployee.canViewReports,
                canManageEmployees: editEmployee.canManageEmployees,
                canManageSettings: editEmployee.canManageSettings,
                canApplyDiscount: editEmployee.canApplyDiscount,
                maxDiscountPercent: editEmployee.maxDiscountPercent,
              }}
              onSave={(data) => updateMutation.mutate({ id: editEmployee.id, data })}
              onClose={() => setEditEmployee(null)}
              loading={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(v) => { if (!v) { setDeleteId(null); setDeleteEmployee(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              حذف الموظف نهائياً
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف <strong>{deleteEmployee?.name}</strong>؟
              سيتم حذف جميع بياناته بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId, permanent: true })}
            >
              حذف نهائي
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
