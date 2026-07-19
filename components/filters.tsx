"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DISTRICTS, DISTRICTS_AND_PLACES, ROOM_TYPES } from "@/lib/districts";

export function Filters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const district = searchParams.get("district");
  const place = searchParams.get("place");
  const roomType = searchParams.get("type");

  const [min, setMin] = useState(searchParams.get("min") ?? "");
  const [max, setMax] = useState(searchParams.get("max") ?? "");
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);

  function setParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // changing any filter starts back at page 1
    router.replace(params.size ? `/?${params}` : "/", { scroll: false });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (min === (searchParams.get("min") ?? "") && max === (searchParams.get("max") ?? "")) return;
      setParams({ min: min || null, max: max || null });
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max]);

  // Keep the inputs in sync when the URL changes from elsewhere (e.g. "Clear filters"),
  // but never while the user is typing in them
  useEffect(() => {
    const focused = document.activeElement;
    if (focused !== minRef.current && focused !== maxRef.current) {
      setMin(searchParams.get("min") ?? "");
      setMax(searchParams.get("max") ?? "");
    }
  }, [searchParams]);

  const hasFilters = Boolean(district || place || roomType || min || max);

  const districtItems = [
    { value: null, label: "All districts" },
    ...DISTRICTS.map((d) => ({ value: d, label: d })),
  ];
  const placeItems = [
    { value: null, label: "All areas" },
    ...(district ? DISTRICTS_AND_PLACES[district] ?? [] : []).map((p) => ({ value: p, label: p })),
  ];
  const typeItems = [
    { value: null, label: "Any type" },
    ...ROOM_TYPES.map((t) => ({ value: t.value as string, label: t.label })),
  ];

  return (
    <div className="grid grid-cols-2 items-center gap-2 lg:flex lg:flex-wrap">
      <Select
        items={districtItems}
        value={district}
        onValueChange={(value) => setParams({ district: value, place: null })}
      >
        <SelectTrigger className="w-full lg:w-48">
          <SelectValue placeholder="All districts" />
        </SelectTrigger>
        <SelectContent>
          {districtItems.map((item) => (
            <SelectItem key={item.label} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={placeItems}
        value={place}
        onValueChange={(value) => setParams({ place: value })}
        disabled={!district}
      >
        <SelectTrigger className="w-full lg:w-48">
          <SelectValue placeholder="All areas" />
        </SelectTrigger>
        <SelectContent>
          {placeItems.map((item) => (
            <SelectItem key={item.label} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={typeItems}
        value={roomType}
        onValueChange={(value) => setParams({ type: value })}
      >
        <SelectTrigger className="w-full lg:w-36">
          <SelectValue placeholder="Any type" />
        </SelectTrigger>
        <SelectContent>
          {typeItems.map((item) => (
            <SelectItem key={item.label} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="col-span-2 flex items-center gap-2 lg:col-span-1 lg:w-auto">
        <Input
          ref={minRef}
          type="number"
          inputMode="numeric"
          placeholder="Min Nu."
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className="w-full lg:w-28"
        />
        <span className="text-muted-foreground">–</span>
        <Input
          ref={maxRef}
          type="number"
          inputMode="numeric"
          placeholder="Max Nu."
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className="w-full lg:w-28"
        />
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="col-span-2 justify-self-start lg:col-span-1"
          onClick={() => {
            setMin("");
            setMax("");
            router.replace("/", { scroll: false });
          }}
        >
          Reset
        </Button>
      )}
    </div>
  );
}
