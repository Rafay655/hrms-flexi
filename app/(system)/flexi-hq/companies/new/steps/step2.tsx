"use client";

import { showApiError } from "@/lib/error-toast";
import * as React from "react";
import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { companyService } from "@/services/company.service";

import {
  digitalPresenceSchema,
  type DigitalPresenceForm,
  props,
} from "../types";

const emptySocialProfile: DigitalPresenceForm["social_profiles"][number] = {
  platform: "linkedin",
  handle: "",
  url: "",
};

const getInitialSocialProfiles = (
  socialProfiles?: DigitalPresenceForm["social_profiles"] | null
): DigitalPresenceForm["social_profiles"] => {
  if (!socialProfiles?.length) {
    return [emptySocialProfile];
  }

  return socialProfiles.map((profile) => ({
    platform: profile.platform ?? "other",
    handle: profile.handle ?? "",
    url: profile.url ?? "",
  }));
};

const Step2 = ({
  next,
  prev,
  companyUuid,
  initialData,
  onCompanyUpdated,
}: props) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

const form = useForm<DigitalPresenceForm>({
  resolver: zodResolver(digitalPresenceSchema) as any,
  defaultValues: {
    support_email: initialData?.support_email ?? "",
    social_profiles: getInitialSocialProfiles(
      initialData?.social_profiles as DigitalPresenceForm["social_profiles"]
    ),
  },
});

  const { handleSubmit, reset, watch } = form;

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "social_profiles",
  });

  useEffect(() => {
    reset({
      support_email: initialData?.support_email ?? "",
      social_profiles: getInitialSocialProfiles(
        initialData?.social_profiles as DigitalPresenceForm["social_profiles"]
      ),
    });
  }, [initialData, reset]);

  const onSubmit = async (values: DigitalPresenceForm) => {
    try {
      if (!companyUuid) {
        toast.error("Company not found", {
          description: "Please complete Step 1 first.",
        });
        return;
      }

      setIsSubmitting(true);

      const response = await companyService.updateStep2(companyUuid, values);

      onCompanyUpdated?.(response.data);

      toast.success("Digital presence saved", {
        description: "Step 2 saved successfully.",
      });

      next();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save digital presence";

      const validationErrors = error?.response?.data?.errors;

      if (validationErrors) {
        Object.entries(validationErrors).forEach(([field, messages]) => {
          form.setError(field as any, {
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

  const socialProfiles = watch("social_profiles") ?? [];

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
        noValidate
      >
        <FormField
          control={form.control}
          name="support_email"
          render={({ field }) => (
            <FormItem className="relative">
              <FormLabel>Support email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  type="email"
                  placeholder="support@yourcompany.com"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Social profiles</p>
              <p className="text-xs text-muted-foreground">
                Add your public social handles and URLs.
              </p>
            </div>

            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSubmitting || fields.length >= 10}
              onClick={() => append(emptySocialProfile)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add link
            </Button>
          </div>

          {fields.length === 0 && (
            <div className="rounded-md border border-dashed px-3 py-4 text-xs text-muted-foreground">
              No social links added yet. Click{" "}
              <span className="font-medium">Add link</span> to start.
            </div>
          )}

          <div className="space-y-3">
            {fields.map((fieldItem, index) => (
              <div
                key={fieldItem.id}
                className={cn(
                  "grid gap-3 rounded-md border bg-muted/40 p-3",
                  "sm:grid-cols-[1.1fr_1.1fr_2fr_auto]"
                )}
              >
                <FormField
                  control={form.control}
                  name={`social_profiles.${index}.platform`}
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel className="text-[11px]">
                        Platform
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>

                          <SelectContent className="bg-white">
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="twitter">Twitter</SelectItem>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`social_profiles.${index}.handle`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[11px]">Handle</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="@yourbrand"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`social_profiles.${index}.url`}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel className="text-[11px]">URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="https://linkedin.com/company/..."
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-end justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={isSubmitting}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={prev}
          >
            Previous
          </Button>

          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {socialProfiles.length ? "Save & continue" : "Skip & continue"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default Step2;