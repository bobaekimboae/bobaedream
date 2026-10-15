import 'package:dealer_flutter/main.dart';
import 'package:dealer_flutter/seller_inventory_page.dart';
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

  testWidgets('seller inventory filters and selects vehicles', (tester) async {
    tester.view.physicalSize = const Size(393, 852);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(const DealerApp(home: SellerInventoryPage()));

    expect(find.text('매물 관리'), findsOneWidget);
    expect(find.text('랜드로버 레인지로버 4세대 5.0 V8 SC LWB SV AB'), findsOneWidget);

    await tester.tap(find.text('검수 대기'));
    await tester.pumpAndSettle();
    expect(find.text('BMW M3 6세대 M3 xDrive 컴페티션 M'), findsOneWidget);

    await tester.tap(find.byTooltip('격자 보기'));
    await tester.pumpAndSettle();
    expect(find.byType(SliverGrid), findsOneWidget);

    await tester.tap(find.byType(Checkbox).last);
    await tester.pumpAndSettle();
    expect(find.text('1대가 선택되었습니다'), findsOneWidget);
  });
}
