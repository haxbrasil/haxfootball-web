import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronsUpDown,
  Crosshair,
  MapPin,
  Minus,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "#/components/ui/popover";
import type { GeoLaunchConfigFields } from "../utils/launch-config";

type GeoValue = {
  code: string;
  lat: number | null;
  lon: number | null;
};

type GeoPreset = {
  label: string;
  code: string;
  lat: number;
  lon: number;
};

type CountryOption = {
  value: string;
  label: string;
};

type MapSize = {
  width: number;
  height: number;
};

type MapTile = {
  key: string;
  url: string;
  left: number;
  top: number;
};

const mapInitialCenter = { lat: -15.78, lon: -47.93 };
const initialMapZoom = 4;
const minMapZoom = 3;
const maxMapZoom = 8;
const tileSize = 256;
const haxballCountryLocations: ReadonlyArray<{ code: string; lat: number; lon: number }> = [
  ["af", 33.3, 65.1],
  ["al", 41.1, 20.1],
  ["dz", 28, 1.6],
  ["as", -14.2, -170.1],
  ["ad", 42.5, 1.6],
  ["ao", -11.2, 17.8],
  ["ai", 18.2, -63],
  ["ag", 17, -61.7],
  ["ar", -34.5, -58.4],
  ["am", 40, 45],
  ["aw", 12.5, -69.9],
  ["au", -25.2, 133.7],
  ["at", 47.5, 14.5],
  ["az", 40.1, 47.5],
  ["bs", 25, -77.3],
  ["bh", 25.9, 50.6],
  ["bd", 23.6, 90.3],
  ["bb", 13.1, -59.5],
  ["by", 53.7, 27.9],
  ["be", 50.5, 4.4],
  ["bz", 17.1, -88.4],
  ["bj", 9.3, 2.3],
  ["bm", 32.3, -64.7],
  ["bt", 27.5, 90.4],
  ["bo", -16.2, -63.5],
  ["ba", 43.9, 17.6],
  ["bw", -22.3, 24.6],
  ["bv", -54.4, 3.4],
  ["br", -14.2, -51.9],
  ["io", -6.3, 71.8],
  ["vg", 18.4, -64.6],
  ["bn", 4.5, 114.7],
  ["bg", 42.7, 25.4],
  ["bf", 12.2, -1.5],
  ["bi", -3.3, 29.9],
  ["kh", 12.5, 104.9],
  ["cm", 7.3, 12.3],
  ["ca", 56.1, -106.3],
  ["cv", 16, -24],
  ["ky", 19.5, -80.5],
  ["cf", 6.6, 20.9],
  ["td", 15.4, 18.7],
  ["cl", -35.6, -71.5],
  ["cn", 35.8, 104.1],
  ["cx", -10.4, 105.6],
  ["co", 4.5, -74.2],
  ["km", -11.8, 43.8],
  ["cd", -4, 21.7],
  ["cg", -0.2, 15.8],
  ["ck", -21.2, -159.7],
  ["cr", 9.7, -83.7],
  ["hr", 45.1, 15.2],
  ["cu", 21.5, -77.7],
  ["cy", 35.1, 33.4],
  ["cz", 49.8, 15.4],
  ["ci", 7.5, -5.5],
  ["dk", 56.2, 9.5],
  ["dj", 11.8, 42.5],
  ["dm", 15.4, -61.3],
  ["do", 18.7, -70.1],
  ["ec", -1.8, -78.1],
  ["eg", 26.8, 30.8],
  ["sv", 13.7, -88.8],
  ["eng", 55.3, -3.4],
  ["gq", 1.6, 10.2],
  ["er", 15.1, 39.7],
  ["ee", 58.5, 25],
  ["et", 9.1, 40.4],
  ["fo", 61.8, -6.9],
  ["fj", -16.5, 179.4],
  ["fi", 61.9, 25.7],
  ["fr", 46.2, 2.2],
  ["gf", 3.9, -53.1],
  ["pf", -17.6, -149.4],
  ["ga", -0.8, 11.6],
  ["gm", 13.4, -15.3],
  ["ge", 42.3, 43.3],
  ["de", 51.1, 10.4],
  ["gh", 7.9, -1],
  ["gi", 36.1, -5.3],
  ["gr", 39, 21.8],
  ["gl", 71.7, -42.6],
  ["gd", 12.2, -61.6],
  ["gp", 16.9, -62],
  ["gu", 13.4, 144.7],
  ["gt", 15.7, -90.2],
  ["gn", 9.9, -9.6],
  ["gw", 11.8, -15.1],
  ["gy", 4.8, -58.9],
  ["ht", 18.9, -72.2],
  ["hn", 15.1, -86.2],
  ["hk", 22.3, 114.1],
  ["hu", 47.1, 19.5],
  ["is", 64.9, -19],
  ["in", 20.5, 78.9],
  ["id", -0.7, 113.9],
  ["ir", 32.4, 53.6],
  ["iq", 33.2, 43.6],
  ["ie", 53.4, -8.2],
  ["il", 31, 34.8],
  ["it", 41.8, 12.5],
  ["jm", 18.1, -77.2],
  ["jp", 36.2, 138.2],
  ["jo", 30.5, 36.2],
  ["kz", 48, 66.9],
  ["ke", 0, 37.9],
  ["ki", -3.3, -168.7],
  ["xk", 42.6, 20.9],
  ["kw", 29.3, 47.4],
  ["kg", 41.2, 74.7],
  ["la", 19.8, 102.4],
  ["lv", 56.8, 24.6],
  ["lb", 33.8, 35.8],
  ["ls", -29.6, 28.2],
  ["lr", 6.4, -9.4],
  ["ly", 26.3, 17.2],
  ["li", 47.1, 9.5],
  ["lt", 55.1, 23.8],
  ["lu", 49.8, 6.1],
  ["mo", 22.1, 113.5],
  ["mk", 41.6, 21.7],
  ["mg", -18.7, 46.8],
  ["mw", -13.2, 34.3],
  ["my", 4.2, 101.9],
  ["mv", 3.2, 73.2],
  ["ml", 17.5, -3.9],
  ["mt", 35.9, 14.3],
  ["mh", 7.1, 171.1],
  ["mq", 14.6, -61],
  ["mr", 21, -10.9],
  ["mu", -20.3, 57.5],
  ["yt", -12.8, 45.1],
  ["mx", 23.6, -102.5],
  ["fm", 7.4, 150.5],
  ["md", 47.4, 28.3],
  ["mc", 43.7, 7.4],
  ["mn", 46.8, 103.8],
  ["me", 42.7, 19.3],
  ["ms", 16.7, -62.1],
  ["ma", 31.7, -7],
  ["mz", -18.6, 35.5],
  ["mm", 21.9, 95.9],
  ["na", -22.9, 18.4],
  ["nr", -0.5, 166.9],
  ["np", 28.3, 84.1],
  ["nl", 52.1, 5.2],
  ["an", 12.2, -69],
  ["nc", -20.9, 165.6],
  ["nz", -40.9, 174.8],
  ["ni", 12.8, -85.2],
  ["ne", 17.6, 8],
  ["ng", 9, 8.6],
  ["nu", -19, -169.8],
  ["nf", -29, 167.9],
  ["kp", 40.3, 127.5],
  ["mp", 17.3, 145.3],
  ["no", 60.4, 8.4],
  ["om", 21.5, 55.9],
  ["pk", 30.3, 69.3],
  ["pw", 7.5, 134.5],
  ["ps", 31.9, 35.2],
  ["pa", 8.5, -80.7],
  ["pg", -6.3, 143.9],
  ["py", -23.4, -58.4],
  ["pe", -9.1, -75],
  ["ph", 12.8, 121.7],
  ["pn", -24.7, -127.4],
  ["pl", 51.9, 19.1],
  ["pt", 39.3, -8.2],
  ["pr", 18.2, -66.5],
  ["qa", 25.3, 51.1],
  ["ro", 45.9, 24.9],
  ["ru", 61.5, 105.3],
  ["rw", -1.9, 29.8],
  ["re", -21.1, 55.5],
  ["sh", -24.1, -10],
  ["kn", 17.3, -62.7],
  ["lc", 13.9, -60.9],
  ["pm", 46.9, -56.2],
  ["vc", 12.9, -61.2],
  ["ws", -13.7, -172.1],
  ["sm", 43.9, 12.4],
  ["sa", 23.8, 45],
  ["sct", 56.5, 4.2],
  ["sn", 14.4, -14.4],
  ["rs", 44, 21],
  ["sc", -4.6, 55.4],
  ["sl", 8.4, -11.7],
  ["sg", 1.3, 103.8],
  ["sk", 48.6, 19.6],
  ["si", 46.1, 14.9],
  ["sb", -9.6, 160.1],
  ["so", 5.1, 46.1],
  ["za", -30.5, 22.9],
  ["gs", -54.4, -36.5],
  ["kr", 35.9, 127.7],
  ["es", 40.4, -3.7],
  ["lk", 7.8, 80.7],
  ["sd", 12.8, 30.2],
  ["sr", 3.9, -56],
  ["sj", 77.5, 23.6],
  ["sz", -26.5, 31.4],
  ["se", 60.1, 18.6],
  ["ch", 46.8, 8.2],
  ["sy", 34.8, 38.9],
  ["st", 0.1, 6.6],
  ["tw", 23.6, 120.9],
  ["tj", 38.8, 71.2],
  ["tz", -6.3, 34.8],
  ["th", 15.8, 100.9],
  ["tl", -8.8, 125.7],
  ["tg", 8.6, 0.8],
  ["tk", -8.9, -171.8],
  ["to", -21.1, -175.1],
  ["tt", 10.6, -61.2],
  ["tn", 33.8, 9.5],
  ["tr", 41.018001556396484, 28.93000030517578],
  ["tm", 38.9, 59.5],
  ["tc", 21.6, -71.7],
  ["tv", -7.1, 177.6],
  ["um", 0, 0],
  ["vi", 18.3, -64.8],
  ["ug", 1.3, 32.2],
  ["ua", 48.3, 31.1],
  ["ae", 23.4, 53.8],
  ["gb", 55.3, -3.4],
  ["us", 37, -95.7],
  ["uy", -32.5, -55.7],
  ["uz", 41.3, 64.5],
  ["vu", -15.3, 166.9],
  ["va", 41.9, 12.4],
  ["ve", 6.4, -66.5],
  ["vn", 14, 108.2],
  ["wls", 55.3, -3.4],
  ["wf", -13.7, -177.1],
  ["eh", 24.2, -12.8],
  ["ye", 15.5, 48.5],
  ["zm", -13.1, 27.8],
  ["zw", -19, 29.1],
  ["xx1", -80, 80],
  ["xx2", -81, 81],
].map(([code, lat, lon]) => ({ code: String(code), lat: Number(lat), lon: Number(lon) }));
const countryDisplayNames = new Intl.DisplayNames(["pt-BR", "en"], { type: "region" });
const countryNameOverrides: Record<string, string> = {
  an: "Netherlands Antilles",
  eng: "England",
  sct: "Scotland",
  wls: "Wales",
  xk: "Kosovo",
  xx1: "Unidentified Flying Country",
  xx2: "Flying Spaghetti Country",
};
const haxballCountryOptions: CountryOption[] = haxballCountryLocations
  .map(({ code }) => ({
    value: code,
    label: `${countryName(code)} (${code})`,
  }))
  .sort((left, right) => left.label.localeCompare(right.label));
const geoPresets: GeoPreset[] = [
  { label: "São Paulo", code: "br", lat: -23.55, lon: -46.63 },
  { label: "Rio de Janeiro", code: "br", lat: -22.91, lon: -43.17 },
  { label: "Belo Horizonte", code: "br", lat: -19.92, lon: -43.94 },
  { label: "Brasília", code: "br", lat: -15.78, lon: -47.93 },
  { label: "Curitiba", code: "br", lat: -25.43, lon: -49.27 },
  { label: "Fortaleza", code: "br", lat: -3.73, lon: -38.52 },
  { label: "Porto Alegre", code: "br", lat: -30.03, lon: -51.23 },
  { label: "Recife", code: "br", lat: -8.05, lon: -34.88 },
  { label: "Buenos Aires", code: "ar", lat: -34.6, lon: -58.38 },
];

export function GeoLaunchConfigField({ fields }: { fields: GeoLaunchConfigFields }) {
  const initialValue = useMemo(() => initialGeoValue(fields), [fields]);
  const [value, setValue] = useState<GeoValue | null>(initialValue);
  const selectedCountryOption = useMemo(() => countryOption(value?.code ?? ""), [value?.code]);
  const [countryQuery, setCountryQuery] = useState(selectedCountryOption?.label ?? "");
  const filteredCountryOptions = useMemo(() => filterCountryOptions(countryQuery), [countryQuery]);
  const mapInteractionSuppressedUntilRef = useRef(0);
  const [mapCenter, setMapCenter] = useState(() =>
    hasCoordinates(initialValue) ? initialValue : mapInitialCenter,
  );
  const [open, setOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    setValue(initialValue);

    if (hasCoordinates(initialValue)) {
      setMapCenter(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    setCountryQuery(selectedCountryOption?.label ?? "");
  }, [selectedCountryOption]);

  function selectPreset(preset: GeoPreset) {
    setValue(preset);
    setMapCenter(preset);
  }

  function selectMapPoint(point: { lat: number; lon: number }) {
    const selectedPoint = {
      lat: roundCoordinate(point.lat),
      lon: roundCoordinate(point.lon),
    };

    setValue((current) => ({
      code: current?.code ?? "",
      ...selectedPoint,
    }));

    void inferCountryCode(point).then((code) => {
      if (!code) {
        return;
      }

      setValue((current) =>
        current?.lat === selectedPoint.lat && current.lon === selectedPoint.lon
          ? { ...current, code }
          : current,
      );
    });
  }

  function markMapInteractionSuppressed() {
    mapInteractionSuppressedUntilRef.current = performance.now() + 700;
  }

  function isMapInteractionSuppressed() {
    return performance.now() < mapInteractionSuppressedUntilRef.current;
  }

  return (
    <div className="grid gap-3 rounded-md border bg-muted/25 p-3">
      <input type="hidden" name="launchConfig.geoCode" value={value?.code ?? ""} />
      <input type="hidden" name="launchConfig.geoLat" value={value?.lat ?? ""} />
      <input type="hidden" name="launchConfig.geoLon" value={value?.lon ?? ""} />

      <div className="flex flex-col gap-3 min-[520px]:flex-row min-[520px]:flex-wrap min-[520px]:items-center min-[520px]:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="size-4 shrink-0 text-muted-foreground" />
            <span>Localização da sala</span>
          </div>
          <p className="mt-1 text-sm break-words text-muted-foreground">
            {hasCoordinates(value)
              ? `${value.code || "??"} · ${formatCoordinate(value.lat)}, ${formatCoordinate(value.lon)}`
              : "Nenhuma localização selecionada"}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="w-fit max-w-full">
              <Crosshair className="size-4" />
              Escolher no mapa
            </Button>
          </DialogTrigger>
          <DialogContent className="grid max-h-[min(860px,calc(100vh-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Localização da sala</DialogTitle>
              <DialogDescription>Escolha uma região próxima ao público da sala.</DialogDescription>
            </DialogHeader>

            <div className="grid min-h-0 gap-4 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                {geoPresets.map((preset) => (
                  <Button
                    key={`${preset.code}-${preset.label}`}
                    type="button"
                    variant={
                      value &&
                      value.code === preset.code &&
                      value.lat === preset.lat &&
                      value.lon === preset.lon
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => selectPreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <TileGeoMap
                center={mapCenter}
                selectedValue={value}
                isInteractionSuppressed={isMapInteractionSuppressed}
                onCenterChange={setMapCenter}
                onSelect={selectMapPoint}
              />

              <div className="grid gap-3 rounded-md border bg-muted/25 p-3">
                <button
                  type="button"
                  className="flex items-center justify-between gap-3 text-left text-sm font-medium"
                  onClick={() => setAdvancedOpen((current) => !current)}
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4 text-muted-foreground" />
                    Valores exatos
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {advancedOpen ? "Ocultar" : "Editar"}
                  </span>
                </button>

                {advancedOpen ? (
                  <div
                    className="grid gap-3 sm:grid-cols-3"
                    onPointerDownCapture={markMapInteractionSuppressed}
                    onPointerMoveCapture={markMapInteractionSuppressed}
                    onPointerUpCapture={markMapInteractionSuppressed}
                    onClickCapture={markMapInteractionSuppressed}
                    onWheelCapture={markMapInteractionSuppressed}
                  >
                    <div className="grid gap-2">
                      <Label htmlFor="geoCodeExact">País</Label>
                      <CountryPicker
                        id="geoCodeExact"
                        selectedOption={selectedCountryOption}
                        query={countryQuery}
                        options={filteredCountryOptions}
                        onInteraction={markMapInteractionSuppressed}
                        onQueryChange={setCountryQuery}
                        onSelect={(option) => {
                          setCountryQuery(option?.label ?? "");
                          setValue((current) => ({
                            lat: current?.lat ?? null,
                            lon: current?.lon ?? null,
                            code: option?.value ?? "",
                          }));
                        }}
                      />
                      {value?.code && !selectedCountryOption ? (
                        <p className="text-xs text-muted-foreground">{value.code}</p>
                      ) : null}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="geoLatExact">Latitude</Label>
                      <Input
                        id="geoLatExact"
                        type="number"
                        step="0.000001"
                        min={fields.geoLat.minimum}
                        max={fields.geoLat.maximum}
                        value={value?.lat ?? ""}
                        onChange={(event) => {
                          const lat = numberInputValue(event.target.value);

                          setValue((current) => {
                            const nextValue = {
                              code: current?.code ?? "",
                              lon: current?.lon ?? null,
                              lat,
                            };

                            if (hasCoordinates(nextValue)) {
                              setMapCenter(nextValue);
                            }

                            return nextValue;
                          });
                        }}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="geoLonExact">Longitude</Label>
                      <Input
                        id="geoLonExact"
                        type="number"
                        step="0.000001"
                        min={fields.geoLon.minimum}
                        max={fields.geoLon.maximum}
                        value={value?.lon ?? ""}
                        onChange={(event) => {
                          const lon = numberInputValue(event.target.value);

                          setValue((current) => {
                            const nextValue = {
                              code: current?.code ?? "",
                              lat: current?.lat ?? null,
                              lon,
                            };

                            if (hasCoordinates(nextValue)) {
                              setMapCenter(nextValue);
                            }

                            return nextValue;
                          });
                        }}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Confirmar localização
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function CountryPicker({
  id,
  selectedOption,
  query,
  options,
  onInteraction,
  onQueryChange,
  onSelect,
}: {
  id: string;
  selectedOption: CountryOption | null;
  query: string;
  options: CountryOption[];
  onInteraction: () => void;
  onQueryChange: (query: string) => void;
  onSelect: (option: CountryOption | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectOption(option: CountryOption | null) {
    onInteraction();
    onSelect(option);
    setOpen(false);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        onInteraction();
        setOpen(nextOpen);

        if (nextOpen) {
          onQueryChange(selectedOption?.label ?? "");
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-expanded={open}
          aria-haspopup="listbox"
          className="h-auto min-h-10 w-full justify-between gap-2 px-3 py-2 font-normal"
          onPointerDownCapture={onInteraction}
          onClickCapture={onInteraction}
          onWheelCapture={onInteraction}
        >
          <span className={selectedOption ? "truncate" : "truncate text-muted-foreground"}>
            {selectedOption?.label ?? "Selecione um país"}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 max-w-[calc(100vw-3rem)] p-0"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }}
        onPointerDownCapture={onInteraction}
        onPointerMoveCapture={onInteraction}
        onPointerUpCapture={onInteraction}
        onClickCapture={onInteraction}
        onWheelCapture={onInteraction}
      >
        <div className="border-b p-2">
          <Input
            ref={inputRef}
            id={id}
            value={query}
            placeholder="Buscar país"
            autoComplete="off"
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                selectOption(options[0] ?? null);
              }
            }}
          />
        </div>

        <div className="max-h-64 overflow-y-auto p-1" aria-label="Países">
          {options.length > 0 ? (
            options.map((option) => {
              const selected = selectedOption?.value === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className="flex min-h-9 w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                  onClick={() => selectOption(option)}
                >
                  <span className="truncate">{option.label}</span>
                  {selected ? <Check className="size-4 shrink-0" /> : null}
                </button>
              );
            })
          ) : (
            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
              Nenhum país encontrado
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TileGeoMap({
  center,
  selectedValue,
  isInteractionSuppressed,
  onCenterChange,
  onSelect,
}: {
  center: { lat: number; lon: number };
  selectedValue: GeoValue | null;
  isInteractionSuppressed?: () => boolean;
  onCenterChange: (center: { lat: number; lon: number }) => void;
  onSelect: (point: { lat: number; lon: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    center: { lat: number; lon: number };
    moved: boolean;
  } | null>(null);
  const [size, setSize] = useState<MapSize>({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(initialMapZoom);
  const tiles = useMemo(() => getVisibleTiles(center, size, zoom), [center, size, zoom]);
  const markerPosition = useMemo(() => {
    if (!hasCoordinates(selectedValue) || size.width === 0 || size.height === 0) {
      return null;
    }

    return getScreenPosition(selectedValue, center, size, zoom);
  }, [center, selectedValue, size, zoom]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) {
        return;
      }

      setSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-[20rem] touch-none overflow-hidden rounded-md border bg-muted"
      onPointerDown={(event) => {
        if (isInteractionSuppressed?.()) {
          dragStartRef.current = null;
          return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        dragStartRef.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          center,
          moved: false,
        };
      }}
      onPointerMove={(event) => {
        if (isInteractionSuppressed?.()) {
          dragStartRef.current = null;
          return;
        }

        const dragStart = dragStartRef.current;

        if (!dragStart || dragStart.pointerId !== event.pointerId) {
          return;
        }

        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;

        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
          dragStart.moved = true;
        }

        onCenterChange(shiftCenter(dragStart.center, -deltaX, -deltaY, zoom));
      }}
      onWheel={(event) => {
        if (isInteractionSuppressed?.()) {
          event.preventDefault();
          return;
        }

        event.preventDefault();

        if (!containerRef.current || size.width === 0 || size.height === 0) {
          return;
        }

        const nextZoom = clampZoom(zoom + (event.deltaY < 0 ? 1 : -1));

        if (nextZoom === zoom) {
          return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const cursorX = event.clientX - rect.left;
        const cursorY = event.clientY - rect.top;
        const cursorPoint = screenToLngLat(cursorX, cursorY, center, size, zoom);

        setZoom(nextZoom);
        onCenterChange(centerForScreenPoint(cursorPoint, cursorX, cursorY, size, nextZoom));
      }}
      onPointerUp={(event) => {
        if (isInteractionSuppressed?.()) {
          dragStartRef.current = null;
          return;
        }

        const dragStart = dragStartRef.current;

        if (!dragStart || dragStart.pointerId !== event.pointerId) {
          return;
        }

        dragStartRef.current = null;

        if (dragStart.moved || !containerRef.current) {
          return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const point = screenToLngLat(
          event.clientX - rect.left,
          event.clientY - rect.top,
          center,
          size,
          zoom,
        );

        onSelect(point);
      }}
      onPointerCancel={() => {
        dragStartRef.current = null;
      }}
    >
      {tiles.map((tile) => (
        <img
          key={tile.key}
          src={tile.url}
          alt=""
          draggable={false}
          className="absolute max-w-none select-none"
          style={{
            left: tile.left,
            top: tile.top,
            width: tileSize,
            height: tileSize,
          }}
        />
      ))}

      {markerPosition ? (
        <div
          className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-lg ring-2 ring-primary/30"
          style={{
            left: markerPosition.x,
            top: markerPosition.y,
          }}
        />
      ) : null}

      <div className="pointer-events-none absolute right-3 bottom-3 rounded-md border bg-background/90 px-3 py-2 text-xs shadow-sm backdrop-blur">
        {hasCoordinates(selectedValue)
          ? `${selectedValue.code || "??"} · ${formatCoordinate(selectedValue.lat)}, ${formatCoordinate(selectedValue.lon)}`
          : "Clique no mapa para escolher"}
      </div>

      <div
        className="absolute top-3 right-3 grid overflow-hidden rounded-md border bg-background/90 shadow-sm backdrop-blur"
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onWheel={(event) => event.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-none"
          disabled={zoom >= maxMapZoom}
          onClick={() => setZoom((current) => clampZoom(current + 1))}
        >
          <Plus className="size-4" />
          <span className="sr-only">Aproximar</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-none border-t"
          disabled={zoom <= minMapZoom}
          onClick={() => setZoom((current) => clampZoom(current - 1))}
        >
          <Minus className="size-4" />
          <span className="sr-only">Afastar</span>
        </Button>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 rounded-md border bg-background/90 px-2 py-1 text-[0.625rem] text-muted-foreground shadow-sm backdrop-blur">
        © OpenStreetMap
      </div>
    </div>
  );
}

function getVisibleTiles(
  center: { lat: number; lon: number },
  size: MapSize,
  zoom: number,
): MapTile[] {
  if (size.width === 0 || size.height === 0) {
    return [];
  }

  const centerWorld = lngLatToWorld(center.lon, center.lat, zoom);
  const minTileX = Math.floor((centerWorld.x - size.width / 2) / tileSize);
  const maxTileX = Math.floor((centerWorld.x + size.width / 2) / tileSize);
  const minTileY = Math.floor((centerWorld.y - size.height / 2) / tileSize);
  const maxTileY = Math.floor((centerWorld.y + size.height / 2) / tileSize);
  const tileCount = 2 ** zoom;
  const tiles: MapTile[] = [];

  for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
      if (tileY < 0 || tileY >= tileCount) {
        continue;
      }

      const wrappedTileX = modulo(tileX, tileCount);

      tiles.push({
        key: `${zoom}-${wrappedTileX}-${tileY}`,
        url: `https://tile.openstreetmap.org/${zoom}/${wrappedTileX}/${tileY}.png`,
        left: tileX * tileSize - centerWorld.x + size.width / 2,
        top: tileY * tileSize - centerWorld.y + size.height / 2,
      });
    }
  }

  return tiles;
}

function getScreenPosition(
  point: { lat: number; lon: number },
  center: { lat: number; lon: number },
  size: MapSize,
  zoom: number,
) {
  const pointWorld = lngLatToWorld(point.lon, point.lat, zoom);
  const centerWorld = lngLatToWorld(center.lon, center.lat, zoom);

  return {
    x: pointWorld.x - centerWorld.x + size.width / 2,
    y: pointWorld.y - centerWorld.y + size.height / 2,
  };
}

function screenToLngLat(
  x: number,
  y: number,
  center: { lat: number; lon: number },
  size: MapSize,
  zoom: number,
) {
  const centerWorld = lngLatToWorld(center.lon, center.lat, zoom);

  return worldToLngLat(
    {
      x: centerWorld.x - size.width / 2 + x,
      y: centerWorld.y - size.height / 2 + y,
    },
    zoom,
  );
}

function centerForScreenPoint(
  point: { lat: number; lon: number },
  x: number,
  y: number,
  size: MapSize,
  zoom: number,
) {
  const pointWorld = lngLatToWorld(point.lon, point.lat, zoom);

  return worldToLngLat(
    {
      x: pointWorld.x - x + size.width / 2,
      y: pointWorld.y - y + size.height / 2,
    },
    zoom,
  );
}

function shiftCenter(
  center: { lat: number; lon: number },
  deltaX: number,
  deltaY: number,
  zoom: number,
) {
  const centerWorld = lngLatToWorld(center.lon, center.lat, zoom);

  return worldToLngLat(
    {
      x: centerWorld.x + deltaX,
      y: centerWorld.y + deltaY,
    },
    zoom,
  );
}

function lngLatToWorld(lon: number, lat: number, zoom: number) {
  const scale = tileSize * 2 ** zoom;
  const clampedLat = Math.max(Math.min(lat, 85.05112878), -85.05112878);
  const sin = Math.sin((clampedLat * Math.PI) / 180);

  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function worldToLngLat(point: { x: number; y: number }, zoom: number) {
  const scale = tileSize * 2 ** zoom;
  const lon = (point.x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * point.y) / scale;

  return {
    lat: (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
    lon,
  };
}

async function inferCountryCode(point: { lat: number; lon: number }): Promise<string | null> {
  const { iso1A2Code } = await import("@rapideditor/country-coder");
  const countryCode = iso1A2Code([point.lon, point.lat], { level: "territory" });

  return countryCode ? normalizeCountryCode(countryCode) : null;
}

function countryName(code: string): string {
  const override = countryNameOverrides[code];

  if (override) {
    return override;
  }

  if (code.length === 2) {
    try {
      return countryDisplayNames.of(code.toUpperCase()) ?? code;
    } catch {
      return code;
    }
  }

  return code;
}

function countryOption(code: string): CountryOption | null {
  const normalizedCode = normalizeCountryCode(code);

  return haxballCountryOptions.find((option) => option.value === normalizedCode) ?? null;
}

function filterCountryOptions(query: string): CountryOption[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return haxballCountryOptions;
  }

  return haxballCountryOptions.filter((option) =>
    normalizeSearchText(`${option.label} ${option.value}`).includes(normalizedQuery),
  );
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function initialGeoValue(fields: GeoLaunchConfigFields): GeoValue | null {
  const code = stringDefault(fields.geoCode.defaultValue);
  const lat = numberDefault(fields.geoLat.defaultValue);
  const lon = numberDefault(fields.geoLon.defaultValue);

  if (!code && lat === null && lon === null) {
    return null;
  }

  return { code: normalizeCountryCode(code ?? ""), lat, lon };
}

function stringDefault(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberDefault(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeCountryCode(value: string): string {
  return value
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 3)
    .toLowerCase();
}

function numberInputValue(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function hasCoordinates(value: GeoValue | null): value is GeoValue & { lat: number; lon: number } {
  return value !== null && value.lat !== null && value.lon !== null;
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function clampZoom(value: number): number {
  return Math.max(minMapZoom, Math.min(maxMapZoom, value));
}

function formatCoordinate(value: number): string {
  return value.toFixed(4);
}
