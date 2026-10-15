class Car {
  const Car({
    required this.id,
    required this.maker,
    required this.model,
    required this.generation,
    required this.trim,
    required this.year,
    required this.mileage,
    required this.fuel,
    required this.price,
    required this.priceKind,
    required this.company,
    required this.dealer,
    required this.body,
    required this.origin,
    required this.posted,
    required this.stock,
    required this.photos,
    required this.thumb,
    required this.cropFill,
  });

  final int id;
  final String maker;
  final String model;
  final String generation;
  final String trim;
  final int year;
  final int mileage;
  final String fuel;

  /// 만원 단위, null = 가격 상담
  final int? price;
  final String priceKind;
  final String company;
  final String dealer;
  final String body;
  final String origin;
  final String posted;
  final int stock;
  final List<String> photos;
  final String? thumb;

  /// 원본 비율 사진(남는 칸을 흐린 같은 사진으로 채운다)
  final bool cropFill;

  factory Car.fromJson(Map<String, dynamic> j) => Car(
        id: j['id'] as int,
        maker: j['maker'] as String,
        model: j['model'] as String,
        generation: j['generation'] as String,
        trim: j['trim'] as String,
        year: j['year'] as int,
        mileage: j['mileage'] as int,
        fuel: j['fuel'] as String,
        price: j['price'] as int?,
        priceKind: j['priceKind'] as String,
        company: j['company'] as String,
        dealer: j['dealer'] as String,
        body: j['body'] as String,
        origin: j['origin'] as String,
        posted: j['posted'] as String,
        stock: j['stock'] as int,
        photos: List<String>.from(j['photos'] as List),
        thumb: j['thumb'] as String?,
        cropFill: j['cropFill'] as bool? ?? false,
      );

  /// 목록 제목: 제조사 모델 세대 등급
  String get title => [maker, model, generation, trim].where((s) => s.isNotEmpty).join(' ');

  /// 목록 사양 줄: 연식(숫자 4자리) · 주행(축약) · 연료
  String get spec => '$year · ${shortMileage(mileage)} · $fuel';

  String get priceText => price == null ? '가격 상담' : '${formatWon(price!)}만원';

  String get location => '서울 서초구 · 서울오토갤러리';

  String get sellerLine => '$dealer $company';
}

/// 주행거리 축약 (9,500km 이상은 만 단위, 목록 규칙)
String shortMileage(int km) {
  if (km >= 9500) {
    final man = km / 10000;
    final text = man >= 10 ? man.round().toString() : man.toStringAsFixed(1).replaceAll(RegExp(r'\.0$'), '');
    return '$text만km';
  }
  return '${formatWon(km)}km';
}

String formatWon(int n) {
  final s = n.toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
    buf.write(s[i]);
  }
  return buf.toString();
}
