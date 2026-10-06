import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import type { QuickGenerationOption, QuickModelVisual } from "../data";
import { searchVehicleCatalog, type VehicleSearchRecord } from "./search.mjs";
import "./vehicle-catalog.css";

export type CatalogScope = "car" | "bike";
type CatalogMake = { id: string; name: string; englishName?: string | null; logoPath?: string | null; sortOrder: number };
type CatalogGroup = { id: string; makeId: string; makeName: string; name: string; sortOrder: number; imagePath?: string | null };
type CatalogGeneration = { id: string; makeId: string; groupId: string; makeName: string; groupName: string; name: string; generationCode?: string | null; releaseYm?: string | null; endYm?: string | null; sortOrder: number; imagePath?: string | null };
type BikeModel = { id: string; makeId: string; groupId: string; makeName: string; groupName: string; name: string; firstYear?: string | null; latestYear?: string | null; genre?: string | null; displacementBand?: string | null; sortOrder: number };
type CatalogIndex = { manufacturers: CatalogMake[]; modelGroups: CatalogGroup[]; generations?: CatalogGeneration[]; models?: BikeModel[] };
type Fuel = { id: string; generationId: string; name: string; sortOrder: number };
type Grade = { id: string; generationId: string; fuelId: string; name: string; sortOrder: number };
type Subgrade = { id: string; generationId: string; fuelId: string; gradeId: string; name: string; sortOrder: number };
type CarMakeFile = { make: CatalogMake; modelGroups: CatalogGroup[]; generations: CatalogGeneration[]; fuelDrive: Fuel[]; grades: Grade[]; subgrades: Subgrade[] };
type BikeMakeFile = { make: CatalogMake; modelGroups: CatalogGroup[]; models: BikeModel[] };
export type CatalogMakeFile = CarMakeFile | BikeMakeFile;

const publicBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.baseURI).pathname;
const catalogBase = `${publicBase}data/vehicle-catalog`;
export const publicCatalogAsset = (path?: string | null) => path ? (/^(?:https?:)?\/\//.test(path) ? path : `${publicBase}${path.replace(/^\//, "")}`) : null;
const yearsLabel = (start?: string | null, end?: string | null) => start ? `${start.slice(0, 4)}~${end?.slice(0, 4) ?? "현재"}` : "연식 정보 없음";

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${catalogBase}/${path}`);
  if (!response.ok) throw new Error(`차량 기준표를 불러오지 못했습니다 (${response.status})`);
  return response.json() as Promise<T>;
}

export function useVehicleCatalog(scope: CatalogScope, selectedMake?: string | null) {
  const [index, setIndex] = useState<CatalogIndex | null>(null);
  const [records, setRecords] = useState<VehicleSearchRecord[] | null>(null);
  const [makeFiles, setMakeFiles] = useState<Record<string, CatalogMakeFile>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIndex(null);
    setRecords(null);
    setMakeFiles({});
    setError(null);
    fetchJson<CatalogIndex>(`${scope === "bike" ? "bikes" : "cars"}-index-v1.json`)
      .then((value) => { if (active) setIndex(value); })
      .catch((reason: Error) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, [scope]);

  const ensureSearch = useCallback(async () => {
    if (records) return records;
    const payload = await fetchJson<{ records: VehicleSearchRecord[] }>(`${scope === "bike" ? "bikes" : "cars"}-search-v1.json`);
    setRecords(payload.records);
    return payload.records;
  }, [records, scope]);

  const loadMake = useCallback(async (makeName: string) => {
    const make = index?.manufacturers.find((item) => item.name === makeName);
    if (!make) return null;
    if (makeFiles[make.id]) return makeFiles[make.id];
    const file = await fetchJson<CatalogMakeFile>(`${scope === "bike" ? "bikes" : "cars"}/${make.id}.json`);
    setMakeFiles((current) => ({ ...current, [make.id]: file }));
    return file;
  }, [index, makeFiles, scope]);

  useEffect(() => { if (selectedMake) void loadMake(selectedMake).catch((reason: Error) => setError(reason.message)); }, [loadMake, selectedMake]);

  const activeMakeFile = useMemo(() => {
    const makeId = index?.manufacturers.find((item) => item.name === selectedMake)?.id;
    return makeId ? makeFiles[makeId] ?? null : null;
  }, [index, makeFiles, selectedMake]);

  const modelsByMaker = useMemo<Record<string, string[]>>(() => {
    if (!index) return {};
    const result: Record<string, string[]> = {};
    for (const make of index.manufacturers) result[make.name] = index.modelGroups.filter((group) => group.makeId === make.id).sort((a, b) => a.sortOrder - b.sortOrder).map((group) => group.name);
    return result;
  }, [index]);

  const generationsByMakerModel = useMemo<Record<string, Record<string, QuickGenerationOption[]>>>(() => {
    if (!index) return {};
    const result: Record<string, Record<string, QuickGenerationOption[]>> = {};
    for (const make of index.manufacturers) result[make.name] = {};
    if (scope === "bike") {
      for (const model of index.models ?? []) {
        const variants = result[model.makeName][model.groupName] ??= [];
        variants.push({ name: model.name, years: yearsLabel(model.firstYear, model.latestYear), variants: [], count: 1 });
      }
    } else {
      const details = activeMakeFile && "grades" in activeMakeFile ? activeMakeFile : null;
      for (const generation of index.generations ?? []) {
        const variants = details?.grades.filter((grade) => grade.generationId === generation.id).sort((a, b) => a.sortOrder - b.sortOrder).map((grade) => ({ name: grade.name, count: 1 })) ?? [];
        const rows = result[generation.makeName][generation.groupName] ??= [];
        rows.push({ name: generation.name, years: yearsLabel(generation.releaseYm, generation.endYm), variants, image: publicCatalogAsset(generation.imagePath) ?? undefined, count: 1, cardLabel: generation.generationCode ?? generation.name, cardSub: yearsLabel(generation.releaseYm, generation.endYm) });
      }
    }
    return result;
  }, [activeMakeFile, index, scope]);

  const modelVisualsByMaker = useMemo<Record<string, Record<string, QuickModelVisual>>>(() => {
    if (!index) return {};
    const result: Record<string, Record<string, QuickModelVisual>> = {};
    for (const make of index.manufacturers) result[make.name] = {};
    for (const group of index.modelGroups) result[group.makeName][group.name] = { image: publicCatalogAsset(group.imagePath) ?? "", count: "1대" };
    return result;
  }, [index]);

  return { scope, index, records, makeFiles, activeMakeFile, error, ensureSearch, loadMake, modelsByMaker, generationsByMakerModel, modelVisualsByMaker };
}

export function CatalogLogo({ path, name, kind = "list" }: { path?: string | null; name: string; kind?: "rail" | "list" | "chip" }) {
  const source = publicCatalogAsset(path);
  return <span className={`catalog-logo is-${kind}${source ? "" : " is-placeholder"}`} data-testid={`catalog-logo-${name}`}>{source ? <img src={source} alt="" draggable={false} /> : <span aria-hidden="true">{name.slice(0, 1)}</span>}</span>;
}

export function CatalogVehicleImage({ path, name, compact = false }: { path?: string | null; name: string; compact?: boolean }) {
  const source = publicCatalogAsset(path);
  return <span className={`catalog-vehicle-image${compact ? " is-compact" : ""}${source ? "" : " is-placeholder"}`}>{source ? <img src={source} alt={`${name} 차량`} loading="lazy" draggable={false} /> : <span aria-label={`${name} 이미지 없음`}><i /></span>}</span>;
}

export function CatalogSearchResults({ records, query, onChoose }: { records: VehicleSearchRecord[] | null; query: string; onChoose: (record: VehicleSearchRecord) => void }) {
  const results = useMemo(() => records ? searchVehicleCatalog(records, query, 30) : [], [query, records]);
  if (!query.trim()) return null;
  return <div className="catalog-search-results" role="listbox" aria-label="차량 기준표 검색 결과" data-testid="catalog-search-results">
    {!records ? <p>차량 기준표를 불러오는 중입니다.</p> : results.length ? results.map((record) => <button key={record.id} type="button" role="option" onMouseDown={(event) => event.preventDefault()} onClick={() => onChoose(record)} data-testid={`catalog-result-${record.id}`}>
      <CatalogLogo path={record.logoPath} name={record.path[0]} />
      <CatalogVehicleImage path={record.imagePath} name={record.path[2] ?? record.name} compact />
      <span><strong>{record.path.join(" › ")}</strong><small>{yearsLabel(record.releaseYm, record.endYm)}</small></span>
    </button>) : <p>일치하는 제조사·모델·등급이 없습니다.</p>}
  </div>;
}

type PickerProps = {
  catalog: ReturnType<typeof useVehicleCatalog>;
  maker: string | null;
  model: string | null;
  generation: string | null;
  initialRecord?: VehicleSearchRecord | null;
  onChoose: (record: VehicleSearchRecord) => void;
  onReset: () => void;
};

export function CatalogVehiclePickerSheet({ catalog, maker, model, generation, initialRecord, onChoose, onReset }: PickerProps) {
  const initialPath = initialRecord?.path ?? ([maker, model, generation].filter(Boolean) as string[]);
  const initialIds = initialRecord?.pathIds ?? [];
  const [path, setPath] = useState<string[]>(initialPath);
  const [ids, setIds] = useState<string[]>(initialIds);
  const [query, setQuery] = useState("");
  const [step, setStep] = useState(initialPath.length);
  const make = catalog.index?.manufacturers.find((item) => item.name === path[0]);
  const makeFile = make ? catalog.makeFiles[make.id] ?? null : null;

  useEffect(() => { setPath(initialPath); setIds(initialIds); setStep(initialPath.length); }, [maker, model, generation, initialRecord]);
  useEffect(() => { if (path[0]) void catalog.loadMake(path[0]); }, [catalog.loadMake, path]);

  const choose = (name: string, id: string) => {
    const nextPath = [...path.slice(0, step), name];
    const nextIds = [...ids.slice(0, step), id];
    setPath(nextPath);
    setIds(nextIds);
    setStep(step + 1);
  };
  const chooseLeaf = (name: string, id: string, type: VehicleSearchRecord["type"]) => onChoose({ id, type, name, path: [...path.slice(0, step), name], pathIds: [...ids.slice(0, step), id] });
  const goBack = () => { setStep((value) => Math.max(0, value - 1)); setPath((value) => value.slice(0, -1)); setIds((value) => value.slice(0, -1)); };
  const groups = catalog.index?.modelGroups.filter((group) => group.makeId === make?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  const selectedGroup = groups.find((group) => group.name === path[1]);
  const carFile = makeFile && "generations" in makeFile ? makeFile : null;
  const bikeFile = makeFile && "models" in makeFile ? makeFile : null;
  const generations = carFile?.generations.filter((item) => item.groupId === selectedGroup?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  const selectedGeneration = generations.find((item) => item.name === path[2]);
  const fuels = carFile?.fuelDrive.filter((item) => item.generationId === selectedGeneration?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  const selectedFuel = fuels.find((item) => item.name === path[3]);
  const grades = carFile?.grades.filter((item) => item.fuelId === selectedFuel?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  const selectedGrade = grades.find((item) => item.name === path[4]);
  const subgrades = carFile?.subgrades.filter((item) => item.gradeId === selectedGrade?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  const bikeModels = bikeFile?.models.filter((item) => item.groupId === selectedGroup?.id).sort((a, b) => a.sortOrder - b.sortOrder) ?? [];
  const titles = catalog.scope === "bike" ? ["제조사", "모델그룹", "모델"] : ["제조사", "모델그룹", "세대", "연료·구동", "등급", "세부등급"];

  return <div className="catalog-picker" data-testid="catalog-picker">
    <label className="catalog-picker-search"><MagnifyingGlassIcon /><input value={query} placeholder="제조사·모델·등급 검색" onFocus={() => void catalog.ensureSearch()} onChange={(event) => { setQuery(event.currentTarget.value); void catalog.ensureSearch(); }} /></label>
    {query ? <CatalogSearchResults records={catalog.records} query={query} onChoose={onChoose} /> : <>
      <header><button type="button" onClick={goBack} disabled={step === 0} aria-label="이전 단계"><ChevronLeftIcon /></button><strong>{titles[Math.min(step, titles.length - 1)]}</strong><small>{path.join(" › ") || "전체 차량"}</small></header>
      <div className="catalog-picker-list">
        {step === 0 ? catalog.index?.manufacturers.map((item) => <button key={item.id} type="button" onClick={() => choose(item.name, item.id)}><CatalogLogo path={item.logoPath} name={item.name} /><span>{item.name}</span></button>) : null}
        {step === 1 ? groups.map((item) => <button key={item.id} type="button" onClick={() => choose(item.name, item.id)}><CatalogVehicleImage path={item.imagePath} name={item.name} compact /><span>{item.name}</span></button>) : null}
        {catalog.scope === "bike" && step === 2 ? bikeModels.map((item) => <button key={item.id} type="button" onClick={() => chooseLeaf(item.name, item.id, "BIKE_MODEL")}><CatalogVehicleImage name={item.name} compact /><span><strong>{item.name}</strong><small>{[item.genre, item.displacementBand].filter(Boolean).join(" · ")}</small></span></button>) : null}
        {catalog.scope === "car" && step === 2 ? generations.map((item) => <button key={item.id} type="button" onClick={() => choose(item.name, item.id)}><CatalogVehicleImage path={item.imagePath} name={item.name} compact /><span><strong>{item.name}</strong><small>{yearsLabel(item.releaseYm, item.endYm)}</small></span></button>) : null}
        {catalog.scope === "car" && step === 3 ? fuels.map((item) => <button key={item.id} type="button" onClick={() => choose(item.name, item.id)}><span>{item.name}</span></button>) : null}
        {catalog.scope === "car" && step === 4 ? grades.map((item) => <button key={item.id} type="button" onClick={() => { const children = carFile?.subgrades.filter((child) => child.gradeId === item.id) ?? []; if (children.length) choose(item.name, item.id); else chooseLeaf(item.name, item.id, "GRADE"); }}><span>{item.name}</span></button>) : null}
        {catalog.scope === "car" && step === 5 ? subgrades.map((item) => <button key={item.id} type="button" onClick={() => chooseLeaf(item.name, item.id, "SUBGRADE")}><span>{item.name}</span></button>) : null}
        {make && !makeFile && step > 0 ? <p>선택한 제조사 기준표를 불러오는 중입니다.</p> : null}
      </div>
    </>}
    <div className="catalog-picker-actions"><button type="button" onClick={() => { setPath([]); setIds([]); setStep(0); setQuery(""); onReset(); }}>초기화</button></div>
  </div>;
}

export type { VehicleSearchRecord } from "./search.mjs";
