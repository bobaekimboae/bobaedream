import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;

import '../models/car.dart';

class CarData {
  const CarData({required this.cars, required this.logos});

  final List<Car> cars;

  /// 제조사 이름 → 로고 파일 이름(assets/logos/{slug}.png)
  final Map<String, String> logos;

  static Future<CarData> load() async {
    final raw = await rootBundle.loadString('assets/data/cars.json');
    return parse(raw);
  }

  static CarData parse(String raw) {
    final map = jsonDecode(raw) as Map<String, dynamic>;
    final cars = (map['cars'] as List).map((e) => Car.fromJson(e as Map<String, dynamic>)).toList();
    return CarData(cars: cars, logos: Map<String, String>.from(map['logos'] as Map));
  }

  /// 매물 수가 많은 제조사 순
  List<MapEntry<String, int>> makerCounts() {
    final counts = <String, int>{};
    for (final c in cars) {
      counts[c.maker] = (counts[c.maker] ?? 0) + 1;
    }
    final list = counts.entries.toList()
      ..sort((a, b) => b.value != a.value ? b.value.compareTo(a.value) : a.key.compareTo(b.key));
    return list;
  }
}
