// ui/steps/step3/index.tsx
"use client";

import { showApiError } from "@/lib/error-toast";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  
  Building2,
  FileText,
  Flag,
  Loader2,
  MapPin,
  UploadCloud,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import SearchableSelect, {
  type Option as SearchOption,
} from "@/components/ui/searchable-select";

import {
  companyStep3Schema,
  type CompanyStep3Form,
  TIMEZONE_OPTIONS,
  type TimezoneValue,
  props,
} from "../types";
import { useBranches } from "@/hooks/useBranches";
import { companyService } from "@/services/company.service";

import { useCountries } from "@/hooks/useCountries";
import { useStates } from "@/hooks/useStates";
import { useCities } from "@/hooks/useCities";
import { useCurrencies } from "@/hooks/useCurrencies";

type AnyRecord = Record<string, any>;

type DateFormat = "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";

type WeekStartDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type CompanyStatus = "active" | "inactive";

const DATE_FORMAT_OPTIONS: { value: DateFormat; label: string }[] = [
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const WEEK_START_OPTIONS: { value: WeekStartDay; label: string }[] = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const STATUS_OPTIONS: { value: CompanyStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const getList = (response: any): AnyRecord[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.data?.data)) return response.data.data;
  return [];
};

const getOptionLabel = (item: AnyRecord) => {
  return (
    item.name ??
    item.country_name ??
    item.state_name ??
    item.city_name ??
    item.currency_name ??
    item.title ??
    "-"
  );
};

const getCountryCode = (item: AnyRecord | null | undefined) => {
  return (
    item?.code ?? item?.iso3 ?? item?.country_code ?? item?.short_code ?? null
  );
};

const getCurrencyCode = (item: AnyRecord | null | undefined) => {
  return item?.code ?? item?.currency_code ?? item?.short_code ?? null;
};

const getCurrencyLabel = (item: AnyRecord) => {
  const code = getCurrencyCode(item) ?? "";
  const name = getOptionLabel(item);

  return code ? `${code} – ${name}` : name;
};

const buildFileSrc = (path: string | null | undefined) => {
  if (!path) return null;

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, "") ?? "";

  return `${apiBaseUrl}${path}`;
};

const getSafeTimezone = (timezone?: string | null): TimezoneValue => {
  const value = (timezone ?? "").replace(/\\\//g, "/").trim();

  const match = TIMEZONE_OPTIONS.find((item) => item.value === value);

  return (match?.value ?? "Asia/Karachi") as TimezoneValue;
};

const getSafeDateFormat = (value?: string | null): DateFormat => {
  if (
    value === "DD/MM/YYYY" ||
    value === "MM/DD/YYYY" ||
    value === "YYYY-MM-DD"
  ) {
    return value;
  }

  return "DD/MM/YYYY";
};

const getSafeWeekStartDay = (value?: string | null): WeekStartDay => {
  if (
    value === "monday" ||
    value === "tuesday" ||
    value === "wednesday" ||
    value === "thursday" ||
    value === "friday" ||
    value === "saturday" ||
    value === "sunday"
  ) {
    return value;
  }

  return "monday";
};

const getSafeStatus = (value?: string | null): CompanyStatus => {
  if (value === "active" || value === "inactive") {
    return value;
  }

  return "active";
};

const Step3 = ({
  next,
  prev,
  companyUuid,
  initialData,
  onCompanyUpdated,
}: props) => {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [letterheadPreview, setLetterheadPreview] = useState<string | null>(
    buildFileSrc(initialData?.letterhead_url),
  );

  const data = initialData as any;

  const form = useForm<CompanyStep3Form>({
    resolver: zodResolver(companyStep3Schema) as any,
    defaultValues: {
      official_email: data?.official_email ?? "",
      phone: data?.phone ?? "",
      timezone: getSafeTimezone(data?.timezone),

      country_id: data?.country?.id ? String(data.country.id) : "",
      state_id: data?.state_province?.id ? String(data.state_province.id) : "",
      city_id: data?.city?.id ? String(data.city.id) : "",

      address_line_1: data?.address_line_1 ?? "",
      address_line_2: data?.address_line_2 ?? "",
      street: data?.street ?? "",
      postal_code: data?.postal_code ?? "",

      incorporation_date: data?.incorporation_date
        ? data.incorporation_date.slice(0, 10)
        : "",

      registration_number: data?.registration_number ?? "",
      tax_vat_id: data?.tax_vat_id ?? "",

      currency_id: data?.currency?.id ? String(data.currency.id) : "",

      letterhead: null,
      remove_letterhead: false,

      date_format: getSafeDateFormat(data?.date_format),
      week_start_day: getSafeWeekStartDay(data?.week_start_day),
      status: getSafeStatus(data?.status),
    },
  });

  const { handleSubmit, reset, watch, setValue } = form;

  const watchCountryId = watch("country_id");
  const watchStateProvinceId = watch("state_id");

  const countriesQuery = useCountries({
    per_page: 1000,
  });

  const statesQuery = useStates({
    per_page: 1000,
    country_id: watchCountryId ? Number(watchCountryId) : undefined,
  });

  const citiesQuery = useCities({
    per_page: 1000,
    country_id: watchCountryId ? Number(watchCountryId) : undefined,
    state_id: watchStateProvinceId ? Number(watchStateProvinceId) : undefined,
  });

  const currenciesQuery = useCurrencies({
    per_page: 1000,
  });
  const branchesQuery = useBranches({
    per_page: 1000,
    // optionally filter only active branches:
    // is_active: 1,
  });

  const branches = useMemo(
    () => getList(branchesQuery.data),
    [branchesQuery.data],
  );

  const branchOptions: SearchOption[] = useMemo(
    () =>
      branches.map((branch) => ({
        value: String(branch.id),
        label: branch.name,
      })),
    [branches],
  );

  const isBranchesLoading = branchesQuery.isLoading;
  const countries = useMemo(
    () => getList(countriesQuery.data),
    [countriesQuery.data],
  );

  const states = useMemo(() => getList(statesQuery.data), [statesQuery.data]);

  const cities = useMemo(() => getList(citiesQuery.data), [citiesQuery.data]);

  const currencies = useMemo(
    () => getList(currenciesQuery.data),
    [currenciesQuery.data],
  );

  const countryOptions: SearchOption[] = useMemo(
    () =>
      countries.map((country) => ({
        value: String(country.id),
        label: getOptionLabel(country),
      })),
    [countries],
  );

  const stateOptions: SearchOption[] = useMemo(
    () =>
      states.map((state) => ({
        value: String(state.id),
        label: getOptionLabel(state),
      })),
    [states],
  );

  const cityOptions: SearchOption[] = useMemo(
    () =>
      cities.map((city) => ({
        value: String(city.id),
        label: getOptionLabel(city),
      })),
    [cities],
  );

  const currencyOptions: SearchOption[] = useMemo(
    () =>
      currencies.map((currency) => ({
        value: String(currency.id),
        label: getCurrencyLabel(currency),
      })),
    [currencies],
  );

  useEffect(() => {
    if (!initialData) return;

    const currentData = initialData as any;

    reset({
      official_email: currentData.official_email ?? "",
      phone: currentData.phone ?? "",
      timezone: getSafeTimezone(currentData.timezone),

      country_id: currentData.country?.id ? String(currentData.country.id) : "",
      state_id: currentData.state_province?.id
        ? String(currentData.state_province.id)
        : "",
      city_id: currentData.city?.id ? String(currentData.city.id) : "",

      address_line_1: currentData.address_line_1 ?? "",
      address_line_2: currentData.address_line_2 ?? "",
      street: currentData.street ?? "",
      postal_code: currentData.postal_code ?? "",

      incorporation_date: currentData.incorporation_date
        ? currentData.incorporation_date.slice(0, 10)
        : "",

      registration_number: currentData.registration_number ?? "",
      tax_vat_id: currentData.tax_vat_id ?? "",

      currency_id: currentData.currency?.id
        ? String(currentData.currency.id)
        : "",

      letterhead: null,
      remove_letterhead: false,

      date_format: getSafeDateFormat(currentData.date_format),
      week_start_day: getSafeWeekStartDay(currentData.week_start_day),
      status: getSafeStatus(currentData.status),
    });

    setLetterheadPreview(buildFileSrc(currentData.letterhead_url));
  }, [initialData, reset]);
  useEffect(() => {
    const currentData = initialData as any;
    if (!currentData?.branches || !branches.length) return;
    const existingIds = currentData.branches.map((b: any) => String(b.id));
    setValue("branch_ids", existingIds, { shouldValidate: true });
  }, [branches, initialData, setValue]);
  // Prefill country by id, code, or name
  useEffect(() => {
    const currentData = initialData as any;
    if (!currentData?.country || !countries.length) return;

    const currentCountryId = form.getValues("country_id");
    if (currentCountryId) return;

    const matchedCountry = countries.find((country) => {
      const idMatch =
        currentData.country.id &&
        String(country.id) === String(currentData.country.id);

      const codeMatch =
        currentData.country.code &&
        getCountryCode(country) === currentData.country.code;

      const nameMatch =
        currentData.country.name &&
        getOptionLabel(country).toLowerCase() ===
          String(currentData.country.name).toLowerCase();

      return idMatch || codeMatch || nameMatch;
    });

    if (matchedCountry?.id) {
      setValue("country_id", String(matchedCountry.id), {
        shouldValidate: true,
      });
    }
  }, [countries, initialData, setValue, form]);

  // Prefill state by id, code, or name after country is selected
  useEffect(() => {
    const currentData = initialData as any;
    if (!currentData?.state_province || !states.length) return;

    const currentStateId = form.getValues("state_id");
    if (currentStateId) return;

    const matchedState = states.find((state) => {
      const idMatch =
        currentData.state_province.id &&
        String(state.id) === String(currentData.state_province.id);

      const codeMatch =
        currentData.state_province.code &&
        (state.code ?? state.state_code ?? state.short_code) ===
          currentData.state_province.code;

      const nameMatch =
        currentData.state_province.name &&
        getOptionLabel(state).toLowerCase() ===
          String(currentData.state_province.name).toLowerCase();

      return idMatch || codeMatch || nameMatch;
    });

    if (matchedState?.id) {
      setValue("state_id", String(matchedState.id), {
        shouldValidate: true,
      });
    }
  }, [states, initialData, setValue, form]);

  // Prefill city by id or name after state is selected
  useEffect(() => {
    const currentData = initialData as any;
    if (!currentData?.city || !cities.length) return;

    const currentCityId = form.getValues("city_id");
    if (currentCityId) return;

    const matchedCity = cities.find((city) => {
      const idMatch =
        currentData.city.id && String(city.id) === String(currentData.city.id);

      const nameMatch =
        currentData.city.name &&
        getOptionLabel(city).toLowerCase() ===
          String(currentData.city.name).toLowerCase();

      return idMatch || nameMatch;
    });

    if (matchedCity?.id) {
      setValue("city_id", String(matchedCity.id), {
        shouldValidate: true,
      });
    }
  }, [cities, initialData, setValue, form]);

  // Prefill currency by id, code, or name
  useEffect(() => {
    const currentData = initialData as any;
    if (!currentData?.currency || !currencies.length) return;

    const currentCurrencyId = form.getValues("currency_id");
    if (currentCurrencyId) return;

    const matchedCurrency = currencies.find((currency) => {
      const idMatch =
        currentData.currency.id &&
        String(currency.id) === String(currentData.currency.id);

      const codeMatch =
        currentData.currency.code &&
        getCurrencyCode(currency) === currentData.currency.code;

      const nameMatch =
        currentData.currency.name &&
        getOptionLabel(currency).toLowerCase() ===
          String(currentData.currency.name).toLowerCase();

      return idMatch || codeMatch || nameMatch;
    });

    if (matchedCurrency?.id) {
      setValue("currency_id", String(matchedCurrency.id), {
        shouldValidate: true,
      });
    }
  }, [currencies, initialData, setValue, form]);

  const saveCompany = async (
    values: CompanyStep3Form,
    shouldRedirect: boolean,
  ) => {
    try {
      if (!companyUuid) {
        toast.error("Company not found", {
          description: "Please complete Step 1 first.",
        });
        return;
      }

      setIsSubmitting(true);

      const response = await companyService.updateStep3(companyUuid, values);

      onCompanyUpdated?.(response.data);

      toast.success("Company details saved", {
        description: shouldRedirect
          ? "Company setup completed successfully."
          : "Step 3 saved successfully.",
      });

      if (shouldRedirect) {
        router.push("/flexi-hq/companies");
        return;
      }

      next();
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to save contact and legal details";

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

  const isCountriesLoading = countriesQuery.isLoading;
  const isStatesLoading = statesQuery.isLoading;
  const isCitiesLoading = citiesQuery.isLoading;
  const isCurrenciesLoading = currenciesQuery.isLoading;

  return (
    <Form {...form}>
      <form className="space-y-6" noValidate>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Registered contact</h3>
          <p className="text-xs text-muted-foreground">
            Official email and phone used for registration and notices.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="official_email"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Official email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="email"
                      placeholder="legal@company.com"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="+92-300-1234567"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem className="relative max-w-sm">
                <FormLabel>Timezone</FormLabel>
                <Select
                  value={field.value ?? "Asia/Karachi"}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="max-h-72 bg-white">
                    {TIMEZONE_OPTIONS.map((timezone) => (
                      <SelectItem key={timezone.value} value={timezone.value}>
                        {timezone.label}
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
            name="branch_ids"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel>Branches *</FormLabel>
                <FormControl>
                  <SearchableSelect
                    options={branchOptions}
                    value={field.value ?? []} // array of string IDs
                    onChange={(values) => field.onChange(values as string[])}
                    placeholder={
                      isBranchesLoading
                        ? "Loading branches..."
                        : "Select branches"
                    }
                    groupLabel="Branches"
                    allowAll={false}
                    widthClass="w-full"
                    disabled={isSubmitting || isBranchesLoading}
                    multiple={true}
                  />
                </FormControl>
                <FormMessage />

                {/* Display selected branch names */}
                {field.value && field.value.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {field.value.map((id: string) => {
                      const branch = branches.find((b) => String(b.id) === id);
                      return branch ? (
                        <Badge key={id} variant={"outline"} className="text-xs px-2!">
                          {branch.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Registered address</h3>
          <p className="text-xs text-muted-foreground">
            Used on contracts, invoices and compliance documents.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="country_id"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      icon={Flag}
                      options={countryOptions}
                      value={field.value || ""}
                      onChange={(value) => {
                        field.onChange(value);
                        setValue("state_id", "");
                        setValue("city_id", "");
                      }}
                      placeholder={
                        isCountriesLoading
                          ? "Loading countries..."
                          : "Select country"
                      }
                      groupLabel="Countries"
                      allowAll={false}
                      widthClass="w-full"
                      disabled={isSubmitting || isCountriesLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state_id"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>State / Province</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      icon={MapPin}
                      options={stateOptions}
                      value={field.value || ""}
                      onChange={(value) => {
                        field.onChange(value);
                        setValue("city_id", "");
                      }}
                      placeholder={
                        !watchCountryId
                          ? "Select country first"
                          : isStatesLoading
                            ? "Loading states..."
                            : "Select state"
                      }
                      groupLabel="States"
                      allowAll={false}
                      widthClass="w-full"
                      disabled={
                        isSubmitting || !watchCountryId || isStatesLoading
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city_id"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      icon={Building2}
                      options={cityOptions}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={
                        !watchStateProvinceId
                          ? "Select state first"
                          : isCitiesLoading
                            ? "Loading cities..."
                            : "Select city"
                      }
                      groupLabel="Cities"
                      allowAll={false}
                      widthClass="w-full"
                      disabled={
                        isSubmitting || !watchStateProvinceId || isCitiesLoading
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <FormField
              control={form.control}
              name="address_line_1"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Address line 1</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Building, street, block..."
                      className="max-h-[96px] min-h-[96px] overflow-y-auto resize-none"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address_line_2"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Address line 2</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Apartment, floor, landmark optional"
                      className="max-h-[96px] min-h-[96px] overflow-y-auto resize-none"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Street</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="Main Boulevard"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Postal code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="54000"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Legal & finance</h3>
          <p className="text-xs text-muted-foreground">
            Registration, tax and billing currency information.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="incorporation_date"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Incorporation date</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="date"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="registration_number"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Registration no.</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="REG-123456"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tax_vat_id"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel>Tax / VAT ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder="1234567-8"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency_id"
              render={({ field }) => (
                <FormItem className="relative sm:col-span-3">
                  <FormLabel>Billing currency</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      icon={Flag}
                      options={currencyOptions}
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder={
                        isCurrenciesLoading
                          ? "Loading currencies..."
                          : "Select currency"
                      }
                      groupLabel="Currencies"
                      allowAll={false}
                      widthClass="w-full"
                      disabled={isSubmitting || isCurrenciesLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="letterhead"
              render={({ field }) => (
                <FormItem className="relative sm:col-span-3">
                  <FormLabel>Letterhead</FormLabel>
                  <FormControl>
                    <div className="rounded-2xl border border-dashed bg-muted/20 p-4 transition hover:border-primary/50 hover:bg-muted/30">
                      {letterheadPreview ? (
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-background">
                              <FileText className="h-7 w-7 text-primary" />
                            </div>

                            <div>
                              <p className="text-sm font-semibold">
                                Letterhead uploaded
                              </p>
                              <p className="text-xs text-muted-foreground">
                                JPG, PNG or PDF file is attached.
                              </p>

                              <a
                                href={letterheadPreview}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex text-xs font-medium text-primary hover:underline"
                              >
                                Preview file
                              </a>
                            </div>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => {
                              setLetterheadPreview(null);
                              field.onChange(null);
                              setValue("remove_letterhead", true);
                            }}
                          >
                            <X className="mr-1.5 h-4 w-4" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl bg-background px-4 py-8 text-center">
                          <UploadCloud className="mb-2 h-8 w-8 text-primary" />
                          <p className="text-sm font-semibold">
                            Upload company letterhead
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            JPG, PNG or PDF up to 5 MB
                          </p>

                          <Input
                            type="file"
                            accept="image/*,application/pdf"
                            disabled={isSubmitting}
                            ref={field.ref}
                            className="hidden"
                            onChange={(event) => {
                              const file = event.target.files?.[0] ?? null;

                              field.onChange(file);
                              setValue("remove_letterhead", false);

                              if (file) {
                                setLetterheadPreview(URL.createObjectURL(file));
                              } else {
                                setLetterheadPreview(null);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="date_format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date format</FormLabel>
                <Select
                  value={field.value ?? "DD/MM/YYYY"}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="bg-white">
                    {DATE_FORMAT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="week_start_day"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Week start day</FormLabel>
                <Select
                  value={field.value ?? "monday"}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select week start day" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="bg-white">
                    {WEEK_START_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                <FormLabel>Status</FormLabel>
                <Select
                  value={field.value ?? "active"}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent className="bg-white">
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={prev}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmit((values) => saveCompany(values, false))}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={handleSubmit((values) => saveCompany(values, true))}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save & finish
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default Step3;
