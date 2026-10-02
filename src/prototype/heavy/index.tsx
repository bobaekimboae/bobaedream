import { heavyDetailsFor, heavyFormOrder, heavyRowsFor, type HeavySelection } from "./data";
import "./heavy.css";

type HeavyQuickFilterProps = { value: HeavySelection; onChange: (next: HeavySelection) => void };
const unique = (values: string[]) => [...new Set(values)];
const compactForm = (value: string) => value.replace(/\([^)]*\)/g, "").trim();

export function HeavyQuickFilter({ value, onChange }: HeavyQuickFilterProps) {
  const detailOptions = heavyDetailsFor(value.form);
  const scopedRows = heavyRowsFor({ form: value.form, detail: value.detail });
  const makerOptions = unique(scopedRows.map((row) => row.maker));
  const modelOptions = unique(heavyRowsFor({ form: value.form, detail: value.detail, maker: value.maker }).map((row) => row.model));

  const chooseForm = (form: string) => onChange({ form, detail: null, maker: null, model: null });
  const chooseDetail = (detail: string) => onChange({ ...value, detail, maker: null, model: null });
  const chooseMaker = (maker: string) => onChange({ ...value, maker, model: null });
  const chooseModel = (model: string) => onChange({ ...value, model });

  const level = !value.form ? "형식" : !value.detail ? "세부형식" : !value.maker ? "제조사" : !value.model ? "모델" : "선택 완료";
  const options = !value.form
    ? heavyFormOrder.map((label) => ({ label, count: heavyRowsFor({ form: label }).length, action: () => chooseForm(label) }))
    : !value.detail
      ? detailOptions.map((label) => ({ label, count: heavyRowsFor({ form: value.form, detail: label }).length, action: () => chooseDetail(label) }))
      : !value.maker
        ? makerOptions.map((label) => ({ label, count: heavyRowsFor({ form: value.form, detail: value.detail, maker: label }).length, action: () => chooseMaker(label) }))
        : !value.model
          ? modelOptions.map((label) => ({ label, count: heavyRowsFor({ form: value.form, detail: value.detail, maker: value.maker, model: label }).length, action: () => chooseModel(label) }))
          : [];

  return (
    <section className="heavy-qf" aria-label={`건설기계 ${level} 빠른 선택`}>
      <div className="heavy-qf-heading"><strong>{level}</strong><span>빅레몬 형식 52종 · 가상 매물 v04 30대</span></div>
      {options.length ? (
        <div className="heavy-qf-track" role="list">
          {options.map((option) => (
            <button key={option.label} type="button" className="heavy-qf-card" disabled={option.count === 0} onClick={option.action} role="listitem">
              <span className="heavy-qf-symbol" aria-hidden="true">{level === "모델" ? option.label.slice(0, 3) : option.label.slice(0, 2)}</span>
              <strong>{level === "형식" ? compactForm(option.label) : option.label}</strong>
              <small>{option.count.toLocaleString("ko-KR")}대</small>
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className="heavy-qf-complete" onClick={() => onChange({ ...value, model: null })}>
          <span className="heavy-qf-symbol" aria-hidden="true">{value.model?.slice(0, 3)}</span>
          <strong>{value.maker} {value.model}</strong>
          <small>{compactForm(value.form ?? "")} · {value.detail}</small>
        </button>
      )}
    </section>
  );
}
