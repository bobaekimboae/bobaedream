import 'package:flutter/material.dart';

import '../models/car.dart';
import '../theme.dart';
import 'photo.dart';

/// 모바일 목록 카드: 썸네일 120 + 제목 · 사양 · 가격 · 지역 · 판매자
class CarCard extends StatelessWidget {
  const CarCard({super.key, required this.car, required this.favorite, required this.onFavorite, required this.onTap});

  final Car car;
  final bool favorite;
  final VoidCallback onFavorite;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: AppColors.line))),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 120,
              height: 120,
              child: Stack(children: [
                Positioned.fill(child: CarPhoto(path: car.thumb, fill: car.cropFill, radius: 8)),
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: Container(
                    height: 36,
                    alignment: Alignment.bottomLeft,
                    padding: const EdgeInsets.fromLTRB(10, 0, 10, 6),
                    decoration: BoxDecoration(
                      borderRadius: const BorderRadius.vertical(bottom: Radius.circular(8)),
                      gradient: const LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Color(0x00000000), Color(0x80000000)]),
                    ),
                    child: Text(car.posted, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ),
              ]),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Expanded(
                      child: Text(car.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, height: 19 / 15, fontWeight: FontWeight.w600, color: AppColors.ink)),
                    ),
                    GestureDetector(
                      onTap: onFavorite,
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.only(left: 6),
                        child: Icon(favorite ? Icons.favorite : Icons.favorite_border, size: 24, color: favorite ? const Color(0xFFE5484D) : AppColors.muted),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 5),
                  Text(car.spec, style: const TextStyle(fontSize: 13, color: AppColors.sub)),
                  const SizedBox(height: 8),
                  Text.rich(
                    TextSpan(children: [
                      TextSpan(text: car.price == null ? '가격 상담' : formatWon(car.price!), style: const TextStyle(fontWeight: FontWeight.w700)),
                      if (car.price != null) const TextSpan(text: '만원', style: TextStyle(fontWeight: FontWeight.w400)),
                    ]),
                    style: const TextStyle(fontSize: 16, color: AppColors.ink),
                  ),
                  const SizedBox(height: 8),
                  Text(car.location, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, color: AppColors.muted)),
                  const SizedBox(height: 4),
                  Text(car.sellerLine, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14, color: AppColors.ink)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
