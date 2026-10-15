import 'dart:io';
import 'dart:ui' show Size;

import 'package:flutter_test/flutter_test.dart';
import 'package:seoul_autogallery/data/repository.dart';
import 'package:seoul_autogallery/main.dart';
import 'package:seoul_autogallery/models/car.dart';

void main() {
  final data = CarData.parse(File('assets/data/cars.json').readAsStringSync());

  test('데이터 24대, 가격 상담 1대, 사진은 모두 존재', () {
    expect(data.cars.length, 24);
    expect(data.cars.where((c) => c.price == null).length, 1);
    for (final c in data.cars) {
      expect(c.photos, isNotEmpty, reason: '${c.id} 사진 없음');
      for (final p in c.photos) {
        expect(File(p).existsSync(), isTrue, reason: p);
      }
    }
  });

  test('표기 규칙', () {
    final m3 = data.cars.firstWhere((c) => c.id == 1);
    expect(m3.spec, '2023 · 2.2만km · 가솔린');
    expect(m3.priceText, '9,595만원');
    expect(shortMileage(9563), '1만km');
    expect(shortMileage(8356), '8,356km');
    expect(data.cars.firstWhere((c) => c.id == 24).priceText, '가격 상담');
    expect(data.cars.first.company.contains('(주)'), isFalse);
  });

  test('제조사 줄은 매물 많은 순', () {
    final counts = data.makerCounts();
    expect(counts.first.key, '벤츠');
    expect(counts.map((e) => e.value).fold<int>(0, (a, b) => a + b), 24);
  });

  testWidgets('목록 → 제조사 필터 → 상세', (tester) async {
    tester.view.physicalSize = const Size(1080, 2340);
    tester.view.devicePixelRatio = 2.8125;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(SeoulAutoGalleryApp(data: data));
    await tester.pump();
    expect(find.text('전체 24대'), findsOneWidget);
    await tester.tap(find.text('벤츠').first);
    await tester.pump();
    expect(find.text('벤츠 11대'), findsOneWidget);
    await tester.tap(find.textContaining('벤츠 S클래스').first);
    await tester.pumpAndSettle();
    expect(find.text('차량 정보'), findsOneWidget);
    expect(find.textContaining('/'), findsWidgets);
  });
}
