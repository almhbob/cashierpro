import { useMemo, useState } from "react";
import { 
  useGetInventoryInsights, 
  getGetInventoryInsightsQueryKey,
  useGetSalesTrends,
  getGetSalesTrendsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";
import { TrendingUp, TrendingDown, Clock, AlertTriangle, PackageSearch } from "lucide-react";

const STATUS_CONFIG = {
  fast: { label: "يبيع بسرعة", color: "bg-green-500/10 text-green-700 border-green-200 dark:border-green-800" },
  normal: { label: "طبيعي", color: "bg-blue-500/10 text-blue-700 border-blue-200 dark:border-blue-800" },
  slow: { label: "بطيء", color: "bg-amber-500/10 text-amber-700 border-amber-200 dark:border-amber-800" },
  dead: { label: "راكد", color: "bg-red-500/10 text-red-700 border-red-200 dark:border-red-800" },
  new: { label: "جديد", color: "bg-gray-500/10 text-gray-700 border-gray-200 dark:border-gray-800" }
};

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("all");

  const { data: insights, isLoading: isInsightsLoading } = useGetInventoryInsights({
    query: {
      queryKey: getGetInventoryInsightsQueryKey()
    }
  });

  const { data: trends, isLoading: isTrendsLoading } = useGetSalesTrends({
    query: {
      queryKey: getGetSalesTrendsQueryKey()
    }
  });

  const filteredInsights = useMemo(() => {
    if (!insights) return [];
    
    let sorted = [...insights].sort((a, b) => b.salesVelocityPerDay - a.salesVelocityPerDay);
    
    if (activeTab !== "all") {
      sorted = sorted.filter(p => p.status === activeTab);
    }
    
    return sorted;
  }, [insights, activeTab]);

  const summary = useMemo(() => {
    if (!insights) return { fast: 0, slow: 0, dead: 0, lowStock: 0 };
    
    return {
      fast: insights.filter(p => p.status === "fast").length,
      slow: insights.filter(p => p.status === "slow").length,
      dead: insights.filter(p => p.status === "dead").length,
      lowStock: insights.filter(p => p.stock > 0 && p.stock <= 5).length
    };
  }, [insights]);

  const trendSummary = useMemo(() => {
    if (!trends || trends.length === 0) return { bestDay: null, avgRevenue: 0 };
    
    const totalRevenue = trends.reduce((acc, curr) => acc + curr.totalRevenue, 0);
    const avgRevenue = totalRevenue / trends.length;
    
    const bestDay = [...trends].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
    
    return { bestDay, avgRevenue };
  }, [trends]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">التحليلات والأداء</h1>
        <p className="text-muted-foreground mt-2">رؤى تفصيلية حول المبيعات وحركة المنتجات</p>
      </div>

      {/* Section B: Sales Trends */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          اتجاهات المبيعات (آخر ٣٠ يوم)
        </h2>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>الإيرادات اليومية</CardTitle>
            </CardHeader>
            <CardContent>
              {isTrendsLoading ? (
                <div className="h-[300px] bg-muted/50 animate-pulse rounded-md" />
              ) : trends && trends.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(val) => new Date(val).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis 
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value} ر.س`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`${value} ر.س`, 'الإيرادات']}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('ar-SA')}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="totalRevenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  لا توجد بيانات متاحة
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">أفضل يوم مبيعات</CardTitle>
              </CardHeader>
              <CardContent>
                {isTrendsLoading ? (
                   <div className="h-8 bg-muted/50 animate-pulse rounded-md w-1/2" />
                ) : trendSummary.bestDay ? (
                  <>
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(trendSummary.bestDay.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(trendSummary.bestDay.date).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </>
                ) : (
                  <div className="text-muted-foreground">-</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">متوسط الإيرادات اليومية</CardTitle>
              </CardHeader>
              <CardContent>
                {isTrendsLoading ? (
                   <div className="h-8 bg-muted/50 animate-pulse rounded-md w-1/2" />
                ) : (
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(trendSummary.avgRevenue)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Section A: Product Insights */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <PackageSearch className="h-5 w-5" />
          أداء المنتجات
        </h2>
        
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">سريعة الحركة</p>
                  <p className="text-2xl font-bold">{summary.fast}</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-full">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">بطيئة الحركة</p>
                  <p className="text-2xl font-bold">{summary.slow}</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-full">
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">راكدة</p>
                  <p className="text-2xl font-bold">{summary.dead}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-full">
                  <Clock className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-y-0">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">مخزون منخفض</p>
                  <p className="text-2xl font-bold">{summary.lowStock}</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-full">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <div className="p-4 border-b">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList>
                <TabsTrigger value="all">الكل</TabsTrigger>
                <TabsTrigger value="fast">سريعة الحركة</TabsTrigger>
                <TabsTrigger value="normal">طبيعي</TabsTrigger>
                <TabsTrigger value="slow">بطيئة الحركة</TabsTrigger>
                <TabsTrigger value="dead">راكدة</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isInsightsLoading ? (
            <div className="p-8 text-center text-muted-foreground">جاري تحميل البيانات...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>المنتج</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>المبيعات (٣٠ يوم)</TableHead>
                  <TableHead>معدل البيع اليومي</TableHead>
                  <TableHead>المخزون يكفي (أيام)</TableHead>
                  <TableHead className="w-[30%]">توصية</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInsights.map((product) => {
                  const statusConf = STATUS_CONFIG[product.status] || STATUS_CONFIG.normal;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.nameAr}</div>
                        <div className="text-xs text-muted-foreground font-mono">{product.barcode}</div>
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConf.color}>
                          {statusConf.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.totalSoldLast30Days} {product.unit}
                      </TableCell>
                      <TableCell>
                        {product.salesVelocityPerDay > 0 ? product.salesVelocityPerDay.toFixed(2) : "-"}
                      </TableCell>
                      <TableCell>
                        {product.daysOfStockLeft !== null ? (
                          <span className={product.daysOfStockLeft < 7 ? "text-red-500 font-bold" : ""}>
                            {Math.round(product.daysOfStockLeft)}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {product.recommendation}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredInsights.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لم يتم العثور على منتجات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}