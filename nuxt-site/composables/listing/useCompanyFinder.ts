import { ref, type Ref } from "vue";

// 리액트 src/prototype/listing/company-finder.tsx 의 useCompanyFinder.
// 템플릿에서는 finder.query.value / finder.letter.value 로 읽는다(props 안의 ref는 자동으로 풀리지 않음).
export type CompanyFinderState = {
  query: Ref<string>;
  setQuery: (next: string) => void;
  letter: Ref<string>;
  setLetter: (next: string) => void;
};

export function useCompanyFinder(): CompanyFinderState {
  const query = ref("");
  const letter = ref("");
  return {
    query,
    setQuery: (next) => { query.value = next; },
    letter,
    setLetter: (next) => { letter.value = next; },
  };
}
