import 'package:flutter/material.dart';

import 'data/repository.dart';
import 'screens/list_screen.dart';
import 'theme.dart';

void main() => runApp(const SeoulAutoGalleryApp());

class SeoulAutoGalleryApp extends StatelessWidget {
  const SeoulAutoGalleryApp({super.key, this.data});

  /// 테스트에서 미리 읽은 데이터를 넣을 수 있다. 없으면 자산에서 읽는다.
  final CarData? data;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '서울오토갤러리',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: data != null
          ? ListScreen(data: data!)
          : FutureBuilder<CarData>(
              future: CarData.load(),
              builder: (context, snap) {
                if (snap.hasError) return Scaffold(body: Center(child: Text('불러오지 못했어요\n${snap.error}')));
                if (!snap.hasData) return const Scaffold(body: Center(child: CircularProgressIndicator()));
                return ListScreen(data: snap.data!);
              },
            ),
    );
  }
}
