import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useListItems, getListItemsQueryKey, useUpsertHubStock, getGetHubStockQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package } from "lucide-react";

const schema = z.object({
  itemId: z.string().min(1, "Select an item"),
  quantity: z.coerce.number().int().min(0, "Must be ≥ 0"),
  expiryDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  hubId: string;
  prefilledBarcode?: string;
  onSuccess?: () => void;
}

export function AddStockDialog({ hubId, prefilledBarcode, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { data: items } = useListItems(undefined, { query: { queryKey: getListItemsQueryKey() } });
  const upsertStock = useUpsertHubStock();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      itemId: prefilledBarcode
        ? (items?.find((i) => i.barcode === prefilledBarcode)?.id ?? "")
        : "",
      quantity: 0,
      expiryDate: "",
    },
  });

  const onSubmit = (data: FormData) => {
    upsertStock.mutate(
      { hubId, data: { itemId: data.itemId, quantity: data.quantity, expiryDate: data.expiryDate || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetHubStockQueryKey(hubId) });
          toast.success("Stock updated successfully");
          form.reset();
          onSuccess?.();
        },
        onError: () => toast.error("Failed to update stock"),
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {prefilledBarcode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Barcode scanned: <code className="font-mono font-bold">{prefilledBarcode}</code>
          </div>
        )}
        <FormField
          control={form.control}
          name="itemId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger data-testid="select-item">
                    <SelectValue placeholder="Select an item…" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(items ?? []).map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} <span className="text-muted-foreground text-xs ml-1">({item.category})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} data-testid="input-quantity" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expiryDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expiry Date <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
              <FormControl>
                <Input type="date" {...field} data-testid="input-expiry-date" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={upsertStock.isPending} data-testid="button-submit-stock">
          {upsertStock.isPending ? "Saving…" : "Save Stock"}
        </Button>
      </form>
    </Form>
  );
}
