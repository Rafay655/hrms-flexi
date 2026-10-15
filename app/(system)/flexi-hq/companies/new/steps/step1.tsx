"use client";

import { showApiError } from "@/lib/error-toast";
import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { companyService } from "@/services/company.service";

import {
  companyStep1Schema,
  props,
  type CompanyFormValues,
} from "../types";

const getDefaultFiscalYm = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const getFiscalYmFromMonth = (month?: string | number | null) => {
  if (!month) return getDefaultFiscalYm();

  if (typeof month === "string" && /^\d{4}-\d{2}$/.test(month)) {
    return month;
  }

  const numericMonth = Number(month);

  if (Number.isNaN(numericMonth) || numericMonth < 1 || numericMonth > 12) {
    return getDefaultFiscalYm();
  }

  const currentYear = new Date().getFullYear();

  return `${currentYear}-${String(numericMonth).padStart(2, "0")}`;
};

const buildLogoSrc = (url: string | null) => {
  if (!url) return "";

  if (url.startsWith("http") || url.startsWith("blob:")) {
    return url;
  }

 const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(
  /\/api\/v1\/?$/,
  ""
);

  return `${apiBaseUrl}${url}`;
};

const Step1 = ({
  next,
  companyUuid,
  setCompanyUuid,
  initialData,
  onCompanyUpdated,
}: props) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialData?.logo_url ?? null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyStep1Schema) as any,
    defaultValues: {
      company_name: initialData?.company_name ?? "",
      company_code: initialData?.company_code ?? "",
      parent_company_id: initialData?.parent_company_id ?? null,
      website_url: initialData?.website_url ?? "",
      fiscal_year_start_month: getFiscalYmFromMonth(
        initialData?.fiscal_year_start_month
      ),
      industry: initialData?.industry ?? "",
      logo: null,
      theme_color: initialData?.theme_color ?? "#1E1B4B",
      description: initialData?.description ?? "",
    },
  });

  React.useEffect(() => {
    if (!initialData) return;

    form.reset({
      company_name: initialData.company_name ?? "",
      company_code: initialData.company_code ?? "",
      parent_company_id: initialData.parent_company_id ?? null,
      website_url: initialData.website_url ?? "",
      fiscal_year_start_month: getFiscalYmFromMonth(
        initialData.fiscal_year_start_month
      ),
      industry: initialData.industry ?? "",
      logo: null,
      theme_color: initialData.theme_color ?? "#1E1B4B",
      description: initialData.description ?? "",
    });

    setPreviewUrl(initialData.logo_url ?? null);
  }, [initialData, form]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: false,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: 2 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];

      if (!file) return;

      form.setValue("logo", file, {
        shouldValidate: true,
        shouldDirty: true,
      });

      const url = URL.createObjectURL(file);

      setPreviewUrl((previousUrl) => {
        if (previousUrl && previousUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previousUrl);
        }

        return url;
      });
    },
    onDropRejected: () => {
      toast.error("Invalid logo", {
        description: "Please upload JPG or PNG image up to 2 MB.",
      });
    },
  });

  const onSubmit = async (values: CompanyFormValues) => {
    try {
      setIsSubmitting(true);

      const response = companyUuid
        ? await companyService.updateStep1(companyUuid, values)
        : await companyService.createStep1(values);

     const savedCompany = response.data;
const savedCompanyUuid = savedCompany.id;

if (!companyUuid && savedCompanyUuid) {
  setCompanyUuid?.(savedCompanyUuid);
}

onCompanyUpdated?.(savedCompany);

toast.success(companyUuid ? "Company updated" : "Company created", {
  description: "Step 1 saved successfully.",
});

next();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save company step 1";

      const validationErrors = error?.response?.data?.errors;

      if (validationErrors) {
        Object.entries(validationErrors).forEach(([field, messages]) => {
          form.setError(field as keyof CompanyFormValues, {
            type: "server",
            message: Array.isArray(messages)
              ? String(messages[0])
              : String(messages),
          });
        });
      }

      showApiError(error, { ...({
        description: message,
      }), fallbackMessage: "Unable to save" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem className="relative sm:col-span-2">
                <FormLabel>Company name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. Bata Pakistan Ltd"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company_code"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Company code *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="e.g. BATA-PK"
                    disabled={isSubmitting}
                    onChange={(event) =>
                      field.onChange(event.target.value.toUpperCase())
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="https://example.com"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. Retail"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fiscal_year_start_month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fiscal year start</FormLabel>
                <FormControl>
                  <Input
                    type="month"
                    {...field}
                    value={field.value ?? ""}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="theme_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Theme color</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2">
                    <Input
                      {...field}
                      type="color"
                      value={field.value ?? "#1E1B4B"}
                      className="h-10 w-16 p-1"
                      disabled={isSubmitting}
                    />
                    <Input
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value)}
                      placeholder="#1E1B4B"
                      className="flex-1"
                      disabled={isSubmitting}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ""}
                  rows={3}
                  placeholder="Short company description..."
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logo"
          render={() => (
            <FormItem className="relative">
              <FormLabel>Logo</FormLabel>
              <FormControl>
                {previewUrl ? (
                  <div className="mt-1 flex flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center text-xs sm:text-sm transition-colors">
                    <div className="relative h-20 w-20 rounded-md border bg-muted">
                      <img
                        src={buildLogoSrc(previewUrl)}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                      />

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => {
                          if (previewUrl.startsWith("blob:")) {
                            URL.revokeObjectURL(previewUrl);
                          }

                          setPreviewUrl(null);
                          form.setValue("logo", null, {
                            shouldValidate: true,
                            shouldDirty: true,
                          });
                        }}
                        className="absolute -top-2 -right-2 inline-flex h-5 w-5 items-center justify-center rounded-full border bg-background text-[10px] shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    {...getRootProps()}
                    className={cn(
                      "mt-1 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-4 py-6 text-center text-xs sm:text-sm transition-colors",
                      isSubmitting && "pointer-events-none opacity-70",
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/20 hover:border-primary/60"
                    )}
                  >
                    <input {...getInputProps()} />
                    <UploadCloud className="mb-2 h-5 w-5 text-primary" />
                    <p className="font-medium">
                      Drop your logo here, or click to browse
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      PNG or JPG, up to 2 MB
                    </p>
                  </div>
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-4 flex items-center justify-end">
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save & continue
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default Step1;