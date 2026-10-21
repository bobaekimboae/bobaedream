import "./sag-google-map.css";

// 소개 탭 구글맵(2026-10-21 「소개에 구글맵 추가해주자」). API 키 없이 쓰는 지도 퍼가기 주소(output=embed)를 쓴다.
const SAG_ADDRESS = "서울 서초구 양재대로11길 36";
const SAG_QUERY = `서울오토갤러리 ${SAG_ADDRESS}`;

export function SagGoogleMap({ title = "오시는 길", address = SAG_ADDRESS, detail, query = SAG_QUERY, place = "서울오토갤러리 · 양재동" }: { title?: string; address?: string; detail?: string; query?: string; place?: string }) {
  const q = encodeURIComponent(query);
  return (
    <section className="sag-map" aria-label={title}>
      <h3>{title}</h3>
      <div className="sag-map__frame">
        <iframe
          title={`${place.split(" · ")[0]} 위치 지도`}
          src={`https://maps.google.com/maps?q=${q}&z=16&hl=ko&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p className="sag-map__address"><b>{detail ? `${address}, ${detail}` : address}</b><span>{place}</span></p>
    </section>
  );
}
