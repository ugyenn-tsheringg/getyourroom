"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export type LatLng = { lat: number; lng: number };

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
  }
}

let mapsPromise: Promise<any> | null = null;
function loadMaps(): Promise<any> {
  if (window.google?.maps) return Promise.resolve(window.google);
  if (!mapsPromise) {
    mapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&v=weekly&libraries=places`;
      script.async = true;
      script.onload = () => resolve(window.google);
      script.onerror = () => reject(new Error("Google Maps failed to load"));
      document.head.appendChild(script);
    });
  }
  return mapsPromise;
}

const BHUTAN_CENTER = { lat: 27.47, lng: 89.64 }; // Thimphu

export function LocationPicker({
  value,
  onChange,
}: {
  value: LatLng | null;
  onChange: (value: LatLng | null) => void;
}) {
  const [open, setOpen] = useState(Boolean(value));
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const mapEl = useRef<HTMLDivElement>(null);
  const searchEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function placeMarker(google: any, pos: LatLng) {
    if (!markerRef.current) {
      markerRef.current = new google.maps.Marker({
        map: mapRef.current,
        position: pos,
        draggable: true,
      });
      markerRef.current.addListener("dragend", () => {
        const p = markerRef.current.getPosition();
        onChangeRef.current({ lat: p.lat(), lng: p.lng() });
      });
    } else {
      markerRef.current.setPosition(pos);
    }
    onChangeRef.current(pos);
  }

  useEffect(() => {
    if (!open || !mapEl.current || mapRef.current) return;
    let cancelled = false;
    loadMaps()
      .then((google) => {
        if (cancelled || !mapEl.current) return;
        mapRef.current = new google.maps.Map(mapEl.current, {
          center: value ?? BHUTAN_CENTER,
          zoom: value ? 17 : 13,
          mapTypeId: "satellite",
          streetViewControl: false,
          fullscreenControl: false,
        });
        if (value) placeMarker(google, value);
        mapRef.current.addListener("click", (e: any) => {
          placeMarker(google, { lat: e.latLng.lat(), lng: e.latLng.lng() });
        });

        // Search box: moves the map to the chosen place; the vendor still
        // sets the actual pin by clicking or dragging.
        if (searchEl.current && !searchEl.current.hasChildNodes() && google.maps.places?.PlaceAutocompleteElement) {
          const autocomplete = new google.maps.places.PlaceAutocompleteElement({
            includedRegionCodes: ["bt"],
          });
          autocomplete.style.width = "100%";
          // Supported on current versions; harmlessly ignored otherwise —
          // the caption below the box covers discoverability either way.
          try {
            autocomplete.placeholder = "Search a town, area, or landmark…";
          } catch {}
          autocomplete.addEventListener("gmp-select", async (event: any) => {
            try {
              const place = event.placePrediction.toPlace();
              await place.fetchFields({ fields: ["location"] });
              if (place.location) {
                mapRef.current?.panTo(place.location);
                mapRef.current?.setZoom(17);
              }
            } catch {
              // ignore — the vendor can still click the map directly
            }
          });
          searchEl.current.appendChild(autocomplete);
        }
      })
      .catch(() => setError("The map couldn't load. You can still post without a location."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setError("This browser doesn't support location — click the map to place the pin instead.");
      return;
    }
    setError(null);
    setLocating(true);

    // Surface the browser's permission state for debugging
    navigator.permissions
      ?.query?.({ name: "geolocation" as PermissionName })
      .then((status) => console.info("[geolocation] permission state:", status.state))
      .catch(() => {});

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        loadMaps().then((google) => {
          mapRef.current?.setCenter(p);
          mapRef.current?.setZoom(17);
          placeMarker(google, p);
        });
      },
      (err) => {
        setLocating(false);
        const names = ["", "PERMISSION_DENIED", "POSITION_UNAVAILABLE", "TIMEOUT"];
        console.error(
          `[geolocation] failed: code=${err.code} (${names[err.code] ?? "?"}) message="${err.message}"`
        );
        const messages: Record<number, string> = {
          1: "Location access is blocked for this site. Allow it in your browser's settings, or click the map to place the pin instead.",
          2: "Your device couldn't determine its location. On a Mac, check System Settings → Privacy & Security → Location Services is on for your browser — or just click the map to place the pin.",
          3: "Finding your location took too long. Try again, or click the map to place the pin instead.",
        };
        setError(
          messages[err.code] ?? "Couldn't get your location — click the map to place the pin instead."
        );
      },
      // Without an explicit timeout the default is infinite — on browsers where
      // the OS never answers, the button would silently hang forever.
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  function clear() {
    markerRef.current?.setMap(null);
    markerRef.current = null;
    onChange(null);
  }

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setOpen(true)}>
        Add location on map
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div ref={searchEl} className="rounded-2xl border bg-background shadow-none" />
      <p className="text-xs text-muted-foreground">
        Search for your town, area, or a nearby landmark to move the map there, then
        tap the map to drop the pin.
      </p>
      <div ref={mapEl} className="aspect-[4/3] w-full overflow-hidden rounded-2xl border bg-muted sm:aspect-video" />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-full"
          disabled={locating}
          onClick={useMyLocation}
        >
          {locating ? "Locating…" : "Use my current location"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={clear}>
            Remove pin
          </Button>
        )}
        <span className="text-xs text-muted-foreground">
          {value
            ? `Pinned at ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
            : "Tap the map to drop a pin, or drag it to adjust."}
        </span>
      </div>
    </div>
  );
}
