import 'package:dealer_flutter/main.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('renders Kim Tae-gyu dealer profile', (tester) async {
    tester.view.physicalSize = const Size(393, 852);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const DealerApp());

    expect(find.text('김태규'), findsOneWidget);
    expect(find.text('투제이모터웍스'), findsWidgets);
    expect(find.text('팔로잉'), findsOneWidget);
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -700));
    await tester.pumpAndSettle();
    expect(find.text('판매차량'), findsOneWidget);
  });

  testWidgets('follow and quote actions update the page', (tester) async {
    tester.view.physicalSize = const Size(393, 852);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const DealerApp());
    await tester.tap(find.text('팔로잉'));
    await tester.pump();
    expect(find.text('팔로우'), findsOneWidget);

    await tester.drag(find.byType(CustomScrollView), const Offset(0, -700));
    await tester.pumpAndSettle();
    await tester.tap(find.text('내차견적'));
    await tester.pumpAndSettle();
    expect(find.text('내차 무료 견적'), findsOneWidget);
  });

  testWidgets('dealer profile golden', (tester) async {
    tester.view.physicalSize = const Size(393, 852);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const DealerApp());
    await tester.pumpAndSettle();
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/dealer-profile.png'),
    );
  });
}
