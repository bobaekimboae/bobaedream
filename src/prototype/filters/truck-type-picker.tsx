import { useEffect, useMemo, useState } from "react";
import { asset } from "../data";
import { truckFormatImageFor, truckSubtypeImageFor, truckSubtypeSecondaryLabel, truckTypeTree, type TruckTypeNode } from "../data/truck-format-catalog";
import type { BbTruckFilter } from "../listing/pc-bbmuseum";
import { BbmActionBar, BbmModal, BbmSheet } from "./bbm-filter-parts";
import "./truck-type-picker.css";

type Props = {
  desktop: boolean;
  open: boolean;
  onClose: () => void;
  value: BbTruckFilter;
};

const nodeValue = (node: TruckTypeNode) => node.value ?? node.label;
const descendantValues = (node: TruckTypeNode): string[] => [nodeValue(node), ...(node.children ?? []).flatMap(descendantValues)];

export function TruckTypePicker({ desktop, open, onClose, value }: Props) {
  const [path, setPath] = useState<TruckTypeNode[]>([]);
  const [format, setFormat] = useState<string | null>(value.format);
  const [subtype, setSubtype] = useState<string | null>(value.subtype);

  useEffect(() => {
    if (!open) return;
    setFormat(value.format);
    setSubtype(value.subtype);
    setPath([]);
  }, [open, value.format, value.subtype]);

  const current = path.at(-1) ?? null;
  const options = current?.children ?? truckTypeTree;
  const root = path[0] ?? null;
  const formatCount = (next: string) => value.countForSelection(next);
  const subtypeCount = (next: string) => root ? value.countForSelection(nodeValue(root), next) : 0;
  const nodeCount = (node: TruckTypeNode) => {
    if (!current) return formatCount(nodeValue(node));
    const values = descendantValues(node);
    return values.reduce((sum, next) => sum + subtypeCount(next), 0);
  };
  const selected = (node: TruckTypeNode) => !current
    ? format === nodeValue(node) && !subtype
    : format === nodeValue(root) && subtype === nodeValue(node);
  const selectedWithin = (node: TruckTypeNode) => current && format === nodeValue(root) && Boolean(subtype && descendantValues(node).includes(subtype));
  const draftCount = useMemo(() => {
    if (!format) return value.formats.reduce((sum, option) => sum + option.count, 0);
    if (!subtype) return formatCount(format);
    return value.countForSelection(format, subtype);
  }, [format, subtype, value.formats, value.subtypes]);

  if (!open) return null;

  const choose = (node: TruckTypeNode) => {
    const next = nodeValue(node);
    if (!current) {
      if (format === next && !subtype) setFormat(null);
      else { setFormat(next); setSubtype(null); }
      return;
    }
    const nextFormat = nodeValue(root);
    if (format === nextFormat && subtype === next) setSubtype(null);
    else { setFormat(nextFormat); setSubtype(next); }
  };
  const drill = (node: TruckTypeNode) => setPath((currentPath) => [...currentPath, node]);
  const reset = () => { setFormat(null); setSubtype(null); setPath([]); };
  const apply = () => { value.onApplySelection(format, subtype); onClose(); };
  const title = current?.label ?? "트럭 유형";
  const goBack = current ? () => setPath((currentPath) => currentPath.slice(0, -1)) : undefined;

  const body = <div className="truck-type-picker" aria-label={`${title} 선택`}>
    {desktop && goBack ? <button type="button" className="truck-type-picker-back" onClick={goBack}><img src={asset("icons/bb/chevron-left.svg")} alt="" aria-hidden="true" />{title}</button> : null}
    <div className="truck-type-picker-list">
      {options.map((node) => {
        const next = nodeValue(node);
        const count = nodeCount(node);
        const hasChildren = Boolean(node.children?.length);
        const image = current ? truckSubtypeImageFor(nodeValue(root), next) : truckFormatImageFor(next);
        const secondaryLabel = current ? truckSubtypeSecondaryLabel(nodeValue(root), next) : null;
        const isSelected = selected(node);
        const isPartial = !isSelected && Boolean(selectedWithin(node));
        return <div key={next} className={`truck-type-picker-row${isSelected ? " is-selected" : ""}${isPartial ? " is-partial" : ""}${count === 0 ? " is-zero" : ""}`}>
          <button type="button" className="truck-type-picker-select" role="checkbox" aria-checked={isPartial ? "mixed" : isSelected} aria-label={`${node.label}, ${count.toLocaleString("ko-KR")}대 선택`} disabled={count === 0} onClick={() => choose(node)}>
            <span className="truck-type-picker-check" aria-hidden="true" />
            <span className="truck-type-picker-image">{image ? <img src={asset(image)} alt="" aria-hidden="true" draggable={false} /> : null}</span>
            <span className="truck-type-picker-label">{node.label}{secondaryLabel ? <small>{secondaryLabel}</small> : null}</span>
            <span className="truck-type-picker-count">{count.toLocaleString("ko-KR")}</span>
          </button>
          {hasChildren ? <button type="button" className="truck-type-picker-drill" aria-label={`${node.label} 하위 유형 보기`} onClick={() => drill(node)}><img src={asset("icons/bb/chevron-left.svg")} alt="" aria-hidden="true" /></button> : null}
        </div>;
      })}
    </div>
  </div>;
  // 모바일은 기본 전체 필터와 같은 하단 액션(초기화 112px + 파란 보기 버튼)을 쓴다.
  const footer = <BbmActionBar variant={desktop ? "modal" : "full"} confirmStyle="보기" count={draftCount} onReset={reset} onConfirm={apply} />;

  return desktop
    ? <BbmModal title={title} onClose={onClose} footer={footer} flush>{body}</BbmModal>
    : <BbmSheet title={title} onClose={onClose} footer={footer} flush onBack={goBack}>{body}</BbmSheet>;
}
