import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation, Link } from "wouter";
import {
  useCreateRequest,
  useListHubs, getListHubsQueryKey,
  useListItems, getListItemsQueryKey,
  getListRequestsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const schema = z.object({
  requestingHubId: z.string().min(1, "Select a hub"),
  priority: z.enum(["Low", "Medium", "Urgent", "Critical"]),
  status: z.enum(["Draft", "Open"]),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RequestItem { itemId: string; quantityNeeded: number }

export default function RequestCreate() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<RequestItem[]>([{ itemId: "", quantityNeeded: 1 }]);

  const { data: hubs } = useListHubs({ query: { queryKey: getListHubsQueryKey() } });
  const { data: allItems } = useListItems(undefined, { query: { queryKey: getListItemsQueryKey() } });
  const createRequest = useCreateRequest();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { requestingHubId: "", priority: "Medium", status: "Draft", notes: "" },
  });

  const addItem = () => setItems((prev) => [...prev, { itemId: "", quantityNeeded: 1 }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, j) => j !== i));
  const updateItem = (i: number, field: keyof RequestItem, value: string | number) =>
    setItems((prev) => prev.map((item, j) => j === i ? { ...item, [field]: value } : item));

  const onSubmit = (data: FormData) => {
    const validItems = items.filter((i) => i.itemId);
    if (!validItems.length) {
      toast.error("Add at least one item to the request");
      return;
    }
    createRequest.mutate(
      { data: { ...data, items: validItems } },
      {
        onSuccess: (req) => {
          queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey() });
          toast.success("Request created successfully");
          setLocation(`/requests/${(req as any).id}`);
        },
        onError: () => toast.error("Failed to create request"),
      }
    );
  };

  const priorityColors: Record<string, string> = {
    Critical: "text-red-600 font-bold",
    Urgent: "text-orange-600 font-bold",
    Medium: "text-amber-600 font-semibold",
    Low: "text-slate-600",
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl">
      <div>
        <Link href="/requests">
          <Button variant="ghost" className="-ml-2 mb-4 text-slate-500 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" /> All Requests
          </Button>
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">New Supply Request</h1>
        <p className="text-slate-500 mt-1">Submit a request for supplies from another hub.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
              <CardTitle className="text-lg">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <FormField
                control={form.control}
                name="requestingHubId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requesting Hub</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-hub">
                          <SelectValue placeholder="Select requesting hub…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(hubs ?? []).map((hub) => (
                          <SelectItem key={hub.id} value={hub.id}>{hub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(["Critical", "Urgent", "Medium", "Low"] as const).map((p) => (
                            <SelectItem key={p} value={p}>
                              <span className={priorityColors[p]}>{p}</span>
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Open">Open</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the situation, urgency level, or any context…" rows={3} {...field} data-testid="textarea-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Items Needed</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem} data-testid="button-add-item">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex gap-3 items-start" data-testid={`row-item-${i}`}>
                  <div className="flex-1">
                    <Select value={item.itemId} onValueChange={(v) => updateItem(i, "itemId", v)}>
                      <SelectTrigger data-testid={`select-item-${i}`}>
                        <SelectValue placeholder="Select item…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(allItems ?? []).map((ai) => (
                          <SelectItem key={ai.id} value={ai.id}>{ai.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-28">
                    <Input
                      type="number"
                      min={1}
                      value={item.quantityNeeded}
                      onChange={(e) => updateItem(i, "quantityNeeded", parseInt(e.target.value, 10) || 1)}
                      placeholder="Qty"
                      data-testid={`input-quantity-${i}`}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    data-testid={`button-remove-item-${i}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {items.some((i) => !i.itemId) && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Select an item for each row
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={createRequest.isPending} data-testid="button-submit-request">
              {createRequest.isPending ? "Creating…" : "Create Request"}
            </Button>
            <Link href="/requests">
              <Button type="button" variant="outline" data-testid="button-cancel">Cancel</Button>
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
}
