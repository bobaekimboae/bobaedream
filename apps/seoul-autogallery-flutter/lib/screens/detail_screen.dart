import 'package:flutter/material.dart';

import '../models/car.dart';
import '../theme.dart';
import '../widgets/photo.dart';

class DetailScreen extends StatefulWidget {
  const DetailScreen({super.key, required this.car});

  final Car car;

  @override
  State<DetailScreen> createState() => _DetailScreenState();
}

class _DetailScreenState extends State<DetailScreen> {
  int _page = 0;

  @override
  Widget build(BuildContext context) {
    final car = widget.car;
    final facts = <(String, String)>[
      ('제조사', car.maker),
      ('모델', car.model),
      if (car.generation.isNotEmpty) ('세대', car.generation),
      ('등급', car.trim),
      ('연식', '${car.year}'),
      ('주행거리', '${formatWon(car.mileage)}km'),
      ('연료', car.fuel),
      ('바디타입', car.body),
      ('원산지', car.origin),
      ('지역', '서울 서초구'),
      ('판매자 유형', '매매업체(딜러)'),
    ];
    return Scaffold(
      appBar: AppBar(title: Text(car.model, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600))),
      body: ListView(children: [
        SizedBox(
          height: 250,
          child: Stack(children: [
            Positioned.fill(
              child: ColoredBox(
                color: AppColors.ink,
                child: car.photos.isEmpty
                    ? const CarPhoto(path: null)
                    : PageView.builder(
                        itemCount: car.photos.length,
                        onPageChanged: (i) => setState(() => _page = i),
                        itemBuilder: (_, i) => CarPhoto(path: car.photos[i], fit: BoxFit.contain),
                      ),
              ),
            ),
            if (car.photos.length > 1)
              Positioned(
                right: 8,
                bottom: 8,
                child: Container(
                  height: 24,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: const Color(0x99000000), borderRadius: BorderRadius.circular(12)),
                  child: Text('${_page + 1} / ${car.photos.length}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                ),
              ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(car.title, style: const TextStyle(fontSize: 19, height: 29.5 / 19, fontWeight: FontWeight.w500, color: AppColors.ink)),
            const SizedBox(height: 4),
            Text(car.spec, style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.sub)),
            const SizedBox(height: 8),
            Text.rich(
              TextSpan(children: [
                TextSpan(text: car.price == null ? '가격 상담' : formatWon(car.price!), style: const TextStyle(fontWeight: FontWeight.w700)),
                if (car.price != null) const TextSpan(text: '만원', style: TextStyle(fontWeight: FontWeight.w400)),
              ]),
              style: const TextStyle(fontSize: 20, height: 28 / 20, color: AppColors.ink),
            ),
            const SizedBox(height: 8),
            Row(children: [
              const Icon(Icons.place_outlined, size: 20, color: AppColors.ink),
              const SizedBox(width: 4),
              Text(car.location, style: const TextStyle(fontSize: 15, color: AppColors.ink)),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              const Icon(Icons.schedule, size: 20, color: AppColors.ink),
              const SizedBox(width: 4),
              Text(car.posted, style: const TextStyle(fontSize: 15, color: AppColors.ink)),
            ]),
            const SizedBox(height: 16),
            _Seller(car: car),
          ]),
        ),
        Container(height: 10, margin: const EdgeInsets.only(top: 16), color: const Color(0xFFF4F4F4)),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('차량 정보', style: TextStyle(fontSize: 18, height: 24 / 18, fontWeight: FontWeight.w700, color: AppColors.ink)),
            const SizedBox(height: 8),
            for (final f in facts) _FactRow(label: f.$1, value: f.$2),
          ]),
        ),
      ]),
    );
  }
}

class _Seller extends StatelessWidget {
  const _Seller({required this.car});

  final Car car;

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      const CircleAvatar(radius: 23, backgroundColor: Color(0xFFF1F1F1), child: Icon(Icons.person, color: AppColors.muted)),
      const SizedBox(width: 14),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text.rich(
            TextSpan(children: [
              TextSpan(text: '${car.dealer} 딜러', style: const TextStyle(fontWeight: FontWeight.w600)),
              TextSpan(text: 'ㆍ${car.company}'),
            ]),
            style: const TextStyle(fontSize: 16, height: 22 / 16, color: AppColors.ink),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text('${car.stock}대 판매중', style: const TextStyle(fontSize: 14, height: 20 / 14, color: AppColors.sub)),
        ]),
      ),
    ]);
  }
}

class _FactRow extends StatelessWidget {
  const _FactRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 7.5),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFE8E8E8)))),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 16, height: 22 / 16, color: AppColors.sub)),
        const SizedBox(width: 16),
        Expanded(child: Text(value, textAlign: TextAlign.right, style: const TextStyle(fontSize: 16, height: 22 / 16, color: AppColors.ink))),
      ]),
    );
  }
}
