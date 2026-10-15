import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';

import '../theme.dart';

/// 매물 사진. 원본 비율 사진(fill)은 남는 칸을 같은 사진을 흐리게 키워 채운다.
class CarPhoto extends StatelessWidget {
  const CarPhoto({super.key, required this.path, this.fill = false, this.fit = BoxFit.cover, this.radius = 0});

  final String? path;
  final bool fill;
  final BoxFit fit;
  final double radius;

  @override
  Widget build(BuildContext context) {
    final p = path;
    final Widget child;
    if (p == null) {
      child = const ColoredBox(color: AppColors.photoBg, child: Center(child: Icon(Icons.image_not_supported_outlined, color: Colors.black26)));
    } else if (fill) {
      child = Stack(fit: StackFit.expand, children: [
        ImageFiltered(imageFilter: ImageFilter.blur(sigmaX: 14, sigmaY: 14), child: Image.asset(p, fit: BoxFit.cover)),
        Image.asset(p, fit: BoxFit.contain),
      ]);
    } else {
      child = Image.asset(p, fit: fit);
    }
    return ClipRRect(borderRadius: BorderRadius.circular(radius), child: child);
  }
}
