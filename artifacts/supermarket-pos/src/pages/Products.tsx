import { useState } from "react";
import { useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getListProductsQueryKey } from "@workspace/api-client-react";
import { useTranslation } from "react-i18next";

export default function Products() {
  const [search, setSearch] = useState("");
  const { data: products, isLoading } = useListProducts({ search });
  const [isEditing, setIsEditing] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { t } = useTranslation();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      barcode: formData.get("barcode") as string,
      name: formData.get("name") as string,
      nameAr: formData.get("nameAr") as string,
      price: parseFloat(formData.get("price") as string),
      stock: parseInt(formData.get("stock") as string),
      category: formData.get("category") as string,
      unit: formData.get("unit") as string,
    };

    if (isEditing) {
      updateProduct.mutate({ id: isEditing.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setIsEditing(null);
          toast({ title: t("products.updated") });
        }
      });
    } else if (isCreating) {
      createProduct.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          setIsCreating(false);
          toast({ title: t("products.added") });
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm(t("products.deleteConfirm"))) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
          toast({ title: t("products.deleted") });
        }
      });
    }
  };

  return (
    <div className="p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t("products.title")}</h1>
        <Button onClick={() => setIsCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" /> {t("products.add")}
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder={t("products.searchPlaceholder")}
          className="pl-4 pr-10 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <Card>
          <table className="w-full border-collapse" style={{ textAlign: "inherit" }}>
            <thead className="bg-muted text-muted-foreground border-b">
              <tr>
                <th className="p-4 font-medium">{t("products.colBarcode")}</th>
                <th className="p-4 font-medium">{t("products.colNameAr")}</th>
                <th className="p-4 font-medium">{t("products.colNameEn")}</th>
                <th className="p-4 font-medium">{t("products.colPrice")}</th>
                <th className="p-4 font-medium">{t("products.colStock")}</th>
                <th className="p-4 font-medium">{t("products.colUnit")}</th>
                <th className="p-4 font-medium">{t("products.colCategory")}</th>
                <th className="p-4 font-medium w-24">{t("products.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">{t("products.loading")}</td></tr>
              ) : products?.map(product => (
                <tr key={product.id} className="border-b hover:bg-muted/30">
                  <td className="p-4 font-mono text-sm">{product.barcode}</td>
                  <td className="p-4 font-bold">{product.nameAr}</td>
                  <td className="p-4 text-muted-foreground">{product.name}</td>
                  <td className="p-4 font-medium text-primary">{formatCurrency(product.price)}</td>
                  <td className="p-4">{product.stock}</td>
                  <td className="p-4">{product.unit}</td>
                  <td className="p-4">{product.category}</td>
                  <td className="p-4 flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsEditing(product)}>
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Dialog open={!!isEditing || isCreating} onOpenChange={(o) => { if (!o) { setIsEditing(null); setIsCreating(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("products.editTitle") : t("products.addTitle")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("products.fieldBarcode")}</label>
                <Input name="barcode" defaultValue={isEditing?.barcode} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("products.fieldCategory")}</label>
                <Input name="category" defaultValue={isEditing?.category} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("products.fieldNameAr")}</label>
                <Input name="nameAr" defaultValue={isEditing?.nameAr} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("products.fieldNameEn")}</label>
                <Input name="name" defaultValue={isEditing?.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("products.fieldPrice")}</label>
                <Input name="price" type="number" step="0.01" defaultValue={isEditing?.price} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("products.fieldStock")}</label>
                <Input name="stock" type="number" defaultValue={isEditing?.stock} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("products.fieldUnit")}</label>
                <Input name="unit" defaultValue={isEditing?.unit || "قطعة"} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateProduct.isPending || createProduct.isPending}>{t("products.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
