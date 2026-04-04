import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import type { SubscriptionPlanDto } from "@/types/subscription.types";
import { usePlanMutations } from "../hooks/useAdminSubscriptions";

interface PlanFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingPlan?: SubscriptionPlanDto | null;
}

type FormValues = {
    name: string;
    durationDays: string;
    sortOrder: string;
    price: string;
    originalPrice: string;
    features: string;
    isActive: "true" | "false";
};

export function PlanFormDialog({ open, onOpenChange, editingPlan }: PlanFormDialogProps) {
    const isEditing = !!editingPlan;
    const { createPlan, updatePlan, isCreating, isUpdating } = usePlanMutations();
    const isPending = isCreating || isUpdating;

    const form = useForm<FormValues>({
        defaultValues: {
            name: "",
            durationDays: "",
            sortOrder: "1",
            price: "",
            originalPrice: "",
            features: "",
            isActive: "true",
        },
    });

    // Reset form khi mở dialog
    useEffect(() => {
        if (open) {
            if (editingPlan) {
                form.reset({
                    name: editingPlan.name,
                    durationDays: String(editingPlan.durationDays),
                    sortOrder: String(editingPlan.sortOrder),
                    price: String(editingPlan.price),
                    originalPrice: editingPlan.originalPrice ? String(editingPlan.originalPrice) : "",
                    features: editingPlan.features?.join("\n") ?? "",
                    isActive: editingPlan.isActive ? "true" : "false",
                });
            } else {
                form.reset({
                    name: "",
                    durationDays: "",
                    sortOrder: "1",
                    price: "",
                    originalPrice: "",
                    features: "",
                    isActive: "true",
                });
            }
        }
    }, [open, editingPlan]);

    // Tính % tiết kiệm realtime
    const discount = useMemo(() => {
        const price = parseFloat(form.watch("price"));
        const original = parseFloat(form.watch("originalPrice"));
        if (!isNaN(price) && !isNaN(original) && original > price && original > 0) {
            return Math.round(((original - price) / original) * 100);
        }
        return null;
    }, [form.watch("price"), form.watch("originalPrice")]);

    const onSubmit = (values: FormValues) => {
        const dto = {
            name: values.name.trim(),
            durationDays: parseInt(values.durationDays),
            sortOrder: parseInt(values.sortOrder),
            price: parseFloat(values.price),
            originalPrice: values.originalPrice ? parseFloat(values.originalPrice) : null,
            features: values.features
                .split("\n")
                .map((f) => f.trim())
                .filter(Boolean),
            isActive: values.isActive === "true",
        };

        if (isEditing && editingPlan) {
            updatePlan(
                { id: editingPlan.id, dto },
                { onSuccess: () => onOpenChange(false) }
            );
        } else {
            createPlan(dto, { onSuccess: () => onOpenChange(false) });
        }
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                {/* Overlay */}
                <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                {/* Content — dùng inline style để đảm bảo căn giữa tuyệt đối */}
                <DialogPrimitive.Content
                    style={{
                        position: "fixed",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 50,
                        width: "100%",
                        maxWidth: 560,
                    }}
                    className="overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
                >
                    {/* Close button */}
                    <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity">
                        <X className="h-4 w-4 text-slate-500" />
                    </DialogPrimitive.Close>

                    {/* Header */}
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/60">
                        <DialogPrimitive.Title className="text-base font-bold text-slate-800 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            {isEditing ? `Chỉnh sửa: ${editingPlan?.name}` : "Thêm gói VIP mới"}
                        </DialogPrimitive.Title>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto [&_input]:bg-white [&_textarea]:bg-white [&_input]:text-slate-900 [&_textarea]:text-slate-900">

                                {/* Tên gói */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    rules={{ required: "Vui lòng nhập tên gói" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-semibold">Tên gói</FormLabel>
                                            <FormControl>
                                                <Input placeholder="VD: VIP 3 Tháng" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Số ngày + Thứ tự */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="durationDays"
                                        rules={{
                                            required: "Bắt buộc",
                                            min: { value: 1, message: "Tối thiểu 1 ngày" },
                                        }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-700 font-semibold">Số ngày</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={1} placeholder="30" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="sortOrder"
                                        rules={{ required: "Bắt buộc" }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-700 font-semibold">Thứ tự hiển thị</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={1} placeholder="1" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Giá bán + Giá gốc */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        rules={{
                                            required: "Bắt buộc",
                                            min: { value: 0, message: "Giá không hợp lệ" },
                                        }}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-700 font-semibold">Giá bán (VND)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={0} placeholder="149000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="originalPrice"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-slate-700 font-semibold">
                                                    Giá gốc (VND)
                                                    <span className="ml-1 font-normal text-slate-400 text-xs">— để trống nếu không giảm</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input type="number" min={0} placeholder="177000" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Badge tiết kiệm */}
                                {discount !== null && (
                                    <p className="text-sm text-green-600 font-medium -mt-2 flex items-center gap-1.5">
                                        <span className="inline-flex items-center bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                            -{discount}%
                                        </span>
                                        Người dùng tiết kiệm {discount}% so với giá gốc
                                    </p>
                                )}

                                {/* Tính năng */}
                                <FormField
                                    control={form.control}
                                    name="features"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-semibold">
                                                Tính năng nổi bật
                                                <span className="ml-1 font-normal text-slate-400 text-xs">— mỗi dòng 1 tính năng</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder={"Xem 1080p không giới hạn\nToàn bộ nội dung VIP độc quyền\nƯu tiên hỗ trợ"}
                                                    className="resize-none h-28 text-sm"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Trạng thái */}
                                <FormField
                                    control={form.control}
                                    name="isActive"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-700 font-semibold">Trạng thái</FormLabel>
                                            <FormControl>
                                                <RadioGroup
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                    className="flex gap-6 mt-1"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <RadioGroupItem value="true" id="active-on" />
                                                        <Label htmlFor="active-on" className="cursor-pointer text-green-600 font-medium">Bật</Label>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <RadioGroupItem value="false" id="active-off" />
                                                        <Label htmlFor="active-off" className="cursor-pointer text-slate-500 font-medium">Tắt</Label>
                                                    </div>
                                                </RadioGroup>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={isPending}
                                    className="flex-1 sm:flex-none"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isPending}
                                    className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-95"
                                >
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEditing ? "Lưu thay đổi" : "Lưu gói"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}