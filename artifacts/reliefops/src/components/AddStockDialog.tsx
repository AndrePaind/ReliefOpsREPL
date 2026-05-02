import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useListItems, getListItemsQueryKey, useUpsertHubStock, getGetHubStockQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package, ChevronsUpDown, Check, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Medicine", "Food", "Hygiene", "First Aid"] as const;

const schema = z.object({
  itemId: z.string().optional(),
  newItemName: z.string().optional(),
  newItemCategory: z.string().optional(),
  quantity: z.coerce.number().int().min(0, "Must be ≥ 0"),
  expiryDate: z.string().optional(),
}).superRefine((d, ctx) => {
  if (!d.itemId && !d.newItemName?.trim()) {
    ctx.addIssue({ code: "custom", path: ["itemId"], message: "Select an item or enter a name" });
  }
});

type FormData = z.infer<typeof schema>;

interface Props {
  hubId: string;
  prefilledBarcode?: string;
  onSuccess?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Medicine: "bg-blue-100 text-blue-700",
  Food: "bg-emerald-100 text-emerald-700",
  Hygiene: "bg-purple-100 text-purple-700",
  "First Aid": "bg-red-100 text-red-700",
};

export function AddStockDialog({ hubId, prefilledBarcode, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const { data: items } = useListItems(undefined, { query: { queryKey: getListItemsQueryKey() } });
  const upsertStock = useUpsertHubStock();
  const [comboOpen, setComboOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      itemId: prefilledBarcode ? (items?.find((i) => i.barcode === prefilledBarcode)?.id ?? "") : "",
      newItemName: "",
      newItemCategory: "Hygiene",
      quantity: 0,
      expiryDate: "",
    },
  });

  const selectedItemId = form.watch("itemId");
  const selectedItem = items?.find((i) => i.id === selectedItemId);

  const onSubmit = async (data: FormData) => {
    let itemId = data.itemId;

    // If manual mode, create the item first
    if (manualMode && data.newItemName?.trim()) {
      try {
        const r = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: data.newItemName.trim(), category: data.newItemCategory ?? "Hygiene", unit: "units" }),
        });
        if (!r.ok) throw new Error("Failed to create item");
        const created = await r.json();
        itemId = created.id;
        queryClient.invalidateQueries({ queryKey: getListItemsQueryKey() });
      } catch {
        toast.error("Could not create item. Please try again.");
        return;
      }
    }

    if (!itemId) return;

    upsertStock.mutate(
      { hubId, data: { itemId, quantity: data.quantity, expiryDate: data.expiryDate || undefined } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetHubStockQueryKey(hubId) });
          toast.success("Stock updated successfully");
          form.reset();
          setManualMode(false);
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
            <Package className="h-4 w-4 shrink-0" />
            Barcode scanned: <code className="font-mono font-bold">{prefilledBarcode}</code>
          </div>
        )}

        {/* Item selection: combobox OR manual text */}
        {!manualMode ? (
          <FormField
            control={form.control}
            name="itemId"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Item</FormLabel>
                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn("w-full justify-between font-normal", !field.value && "text-muted-foreground")}
                      >
                        <span className="truncate">
                          {selectedItem ? (
                            <span className="flex items-center gap-2">
                              {selectedItem.name}
                              <Badge variant="outline" className={`text-[10px] px-1.5 ${CATEGORY_COLORS[selectedItem.category] ?? ""}`}>{selectedItem.category}</Badge>
                            </span>
                          ) : "Search items…"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Type to search…" />
                      <CommandList className="max-h-56">
                        <CommandEmpty>
                          <div className="py-3 text-center text-sm text-slate-500">
                            No item found.{" "}
                            <button type="button" className="text-primary underline font-medium" onClick={() => { setManualMode(true); setComboOpen(false); }}>
                              Add it manually
                            </button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {(items ?? []).map((item) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.name} ${item.category}`}
                              onSelect={() => { field.onChange(item.id); setComboOpen(false); }}
                              className="gap-2"
                            >
                              <Check className={cn("h-4 w-4 text-primary", field.value === item.id ? "opacity-100" : "opacity-0")} />
                              <span className="flex-1 truncate">{item.name}</span>
                              <Badge variant="outline" className={`text-[10px] px-1.5 shrink-0 ${CATEGORY_COLORS[item.category] ?? ""}`}>{item.category}</Badge>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
                <button type="button" className="text-xs text-primary underline self-start mt-1" onClick={() => setManualMode(true)}>
                  Item not in list? Enter manually
                </button>
              </FormItem>
            )}
          />
        ) : (
          <div className="space-y-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-orange-700 flex items-center gap-1.5">
                <PenLine className="h-3.5 w-3.5" /> New item
              </p>
              <button type="button" className="text-xs text-slate-500 underline" onClick={() => { setManualMode(false); form.setValue("newItemName", ""); }}>
                ← Back to list
              </button>
            </div>
            <FormField control={form.control} name="newItemName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Item name *</FormLabel>
                <FormControl><Input placeholder="e.g. Zinc Sulfate Tablets" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="newItemCategory" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>
        )}

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <Input type="number" min={0} {...field} />
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
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={upsertStock.isPending}>
          {upsertStock.isPending ? "Saving…" : "Save Stock"}
        </Button>
      </form>
    </Form>
  );
}
