"use client";

import { AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { MENU_CATEGORIES } from "@/lib/menu-api";
import {
  createVendorMenuItem,
  updateVendorMenuItem,
  type VendorMenuItem,
} from "@/lib/vendor-menu-api";
import {
  type PizzaFormErrors,
  type PizzaFormField,
  type PizzaFormValues,
  validatePizzaFormValues,
} from "@/lib/vendor-menu-validation";
import { ImageUploader } from "./image-uploader";

function getInitialValues(initialItem?: VendorMenuItem): PizzaFormValues {
  if (!initialItem) {
    return {
      itemName: "",
      category: MENU_CATEGORIES[0],
      description: "",
      price: "",
      location: "",
      images: [],
    };
  }

  return {
    itemName: initialItem.itemName,
    category: initialItem.category,
    description: initialItem.description,
    price: Number.isFinite(initialItem.price)
      ? initialItem.price.toFixed(2)
      : "",
    location: initialItem.location,
    images: initialItem.images,
  };
}

export function PizzaForm({
  mode,
  initialItem,
  onSuccess,
  onCancel,
  onValuesChange,
}: {
  mode: "create" | "edit";
  initialItem?: VendorMenuItem;
  onSuccess?: (item?: VendorMenuItem) => void;
  onCancel?: () => void;
  onValuesChange?: (values: PizzaFormValues) => void;
}) {
  const formId = useId();
  const submittingRef = useRef(false);

  const [values, setValues] = useState<PizzaFormValues>(() =>
    getInitialValues(initialItem),
  );
  const [errors, setErrors] = useState<PizzaFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [submitNotice, setSubmitNotice] = useState<{
    tone: "error" | "info" | "success";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    setValues(getInitialValues(initialItem));
    setErrors({});
    setSubmitNotice(null);
  }, [initialItem]);

  useEffect(() => {
    onValuesChange?.(values);
  }, [values, onValuesChange]);

  const updateField = <K extends PizzaFormField>(
    field: K,
    nextValue: PizzaFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
    if (submitNotice) {
      setSubmitNotice(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current || isUploadingImages) {
      return;
    }

    const validation = validatePizzaFormValues(values);
    if (!validation.valid || !validation.payload) {
      setErrors(validation.errors);
      setSubmitNotice({
        tone: "error",
        title: "Check highlighted fields",
        message:
          "Fix the validation errors above before submitting this menu item.",
      });
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitNotice(null);

    try {
      const result =
        mode === "edit" && initialItem
          ? await updateVendorMenuItem(initialItem.id, validation.payload)
          : await createVendorMenuItem(validation.payload);

      if (!result.ok) {
        const isUnavailable = result.reason === "backend-unavailable";
        setSubmitNotice({
          tone: isUnavailable ? "info" : "error",
          title: isUnavailable
            ? "Express vendor menu API unavailable"
            : "Could not save menu item",
          message: result.message,
        });
        toast.add({
          title: isUnavailable
            ? "Vendor API not implemented yet"
            : "Failed to save item",
          description: result.message,
          type: isUnavailable ? "warning" : "error",
        });
        return;
      }

      toast.add({
        title:
          mode === "edit"
            ? "Menu item updated"
            : "Menu item submitted for approval",
        description: result.message,
        type: "success",
      });

      if (mode === "create") {
        setValues(getInitialValues());
      }
      onSuccess?.(result.item);
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const itemNameErrorId = `${formId}-name-error`;
  const categoryErrorId = `${formId}-category-error`;
  const priceErrorId = `${formId}-price-error`;
  const locationErrorId = `${formId}-location-error`;
  const descriptionErrorId = `${formId}-description-error`;
  const imagesErrorId = `${formId}-images-error`;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${formId}-itemName`} className="font-medium">
            Item name
          </Label>
          <Input
            id={`${formId}-itemName`}
            name="itemName"
            placeholder="e.g. San Marzano Margherita"
            value={values.itemName}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.itemName)}
            aria-describedby={errors.itemName ? itemNameErrorId : undefined}
            onChange={(event) => updateField("itemName", event.target.value)}
            className="h-10 rounded-xl bg-background px-3.5"
          />
          {errors.itemName ? (
            <p
              id={itemNameErrorId}
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.itemName}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-category`} className="font-medium">
            Category
          </Label>
          <Select
            value={values.category}
            disabled={isSubmitting}
            onValueChange={(nextValue) =>
              updateField("category", nextValue ?? "")
            }
          >
            <SelectTrigger
              id={`${formId}-category`}
              aria-invalid={Boolean(errors.category)}
              aria-describedby={errors.category ? categoryErrorId : undefined}
              className="h-10 w-full rounded-xl bg-background px-3.5"
            >
              <SelectValue placeholder="Choose category">
                {values.category || "Choose category"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              {MENU_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category ? (
            <p
              id={categoryErrorId}
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.category}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${formId}-price`} className="font-medium">
            Price (USD)
          </Label>
          <div className="relative">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium text-muted-foreground"
            >
              $
            </span>
            <Input
              id={`${formId}-price`}
              name="price"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              max="500"
              placeholder="16.50"
              value={values.price}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={errors.price ? priceErrorId : undefined}
              onChange={(event) => updateField("price", event.target.value)}
              className="h-10 rounded-xl bg-background pr-3.5 pl-8 tabular-nums"
            />
          </div>
          {errors.price ? (
            <p
              id={priceErrorId}
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.price}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor={`${formId}-location`} className="font-medium">
            Kitchen location / area
          </Label>
          <Input
            id={`${formId}-location`}
            name="location"
            placeholder="e.g. Midtown West"
            value={values.location}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.location)}
            aria-describedby={errors.location ? locationErrorId : undefined}
            onChange={(event) => updateField("location", event.target.value)}
            className="h-10 rounded-xl bg-background px-3.5"
          />
          {errors.location ? (
            <p
              id={locationErrorId}
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.location}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`${formId}-description`} className="font-medium">
              Description
            </Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {values.description.trim().length} / 500
            </span>
          </div>
          <Textarea
            id={`${formId}-description`}
            name="description"
            rows={4}
            maxLength={500}
            placeholder="Describe the crust style, sauce, cheeses, toppings, and serving notes..."
            value={values.description}
            disabled={isSubmitting}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? descriptionErrorId : undefined
            }
            onChange={(event) => updateField("description", event.target.value)}
            className="min-h-28 rounded-xl bg-background px-3.5 py-2.5 leading-relaxed"
          />
          {errors.description ? (
            <p
              id={descriptionErrorId}
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.description}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label className="font-medium">Pizza photos</Label>
          <ImageUploader
            value={values.images}
            disabled={isSubmitting}
            invalid={Boolean(errors.images)}
            errorId={errors.images ? imagesErrorId : undefined}
            onUploadingChange={setIsUploadingImages}
            onChange={(nextImages) => updateField("images", nextImages)}
          />
          {errors.images ? (
            <p
              id={imagesErrorId}
              role="alert"
              className="text-xs font-medium text-destructive"
            >
              {errors.images}
            </p>
          ) : null}
        </div>
      </div>

      {mode === "create" ? (
        <Alert className="rounded-xl bg-accent/55">
          <Info className="size-4 text-primary" aria-hidden="true" />
          <AlertTitle>Admin review before publishing</AlertTitle>
          <AlertDescription>
            New menu listings are created in <strong>Pending</strong> status and
            appear to customers after admin approval.
          </AlertDescription>
        </Alert>
      ) : null}

      {submitNotice ? (
        <Alert
          variant={submitNotice.tone === "error" ? "destructive" : "default"}
          className="rounded-xl"
        >
          {submitNotice.tone === "success" ? (
            <CheckCircle2
              className="size-4 text-emerald-600"
              aria-hidden="true"
            />
          ) : submitNotice.tone === "info" ? (
            <Info className="size-4 text-primary" aria-hidden="true" />
          ) : (
            <AlertCircle className="size-4" aria-hidden="true" />
          )}
          <AlertTitle>{submitNotice.title}</AlertTitle>
          <AlertDescription>{submitNotice.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/70 pt-4">
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onCancel}
            className="h-10 rounded-xl bg-card px-4"
          >
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          disabled={isSubmitting || isUploadingImages}
          className="h-10 rounded-xl px-5 font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {mode === "edit" ? "Saving changes..." : "Submitting listing..."}
            </>
          ) : isUploadingImages ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Waiting for image upload...
            </>
          ) : mode === "edit" ? (
            "Save Changes"
          ) : (
            "Create Menu Item"
          )}
        </Button>
      </div>
    </form>
  );
}
