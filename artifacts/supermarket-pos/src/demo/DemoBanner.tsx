import { FlaskConical, X, PhoneCall } from "lucide-react";
import { useDemo } from "./DemoContext";
import { Button } from "@/components/ui/button";

export function DemoBanner() {
  const { exitDemo } = useDemo();

  return (
    <div className="w-full bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-4 z-50 shrink-0" dir="rtl">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 bg-white/20 rounded-lg shrink-0">
          <FlaskConical className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <span className="font-bold text-sm">وضع التجريبي النشط</span>
          <span className="hidden sm:inline text-amber-100 text-sm"> — البيانات المعروضة للتوضيح فقط ولن تُحفظ</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href="https://wa.me/966500000000?text=أريد الاشتراك في كاشير برو"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 bg-white text-amber-600 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          اشترك الآن
        </a>
        <Button
          variant="ghost"
          size="sm"
          onClick={exitDemo}
          className="text-white hover:bg-white/20 hover:text-white h-8 px-3 text-xs font-semibold gap-1.5"
        >
          <X className="h-3.5 w-3.5" />
          إنهاء التجربة
        </Button>
      </div>
    </div>
  );
}
