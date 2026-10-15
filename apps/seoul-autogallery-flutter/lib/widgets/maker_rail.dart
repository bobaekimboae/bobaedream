import 'package:flutter/material.dart';

import '../data/repository.dart';
import '../theme.dart';

/// 제조사 로고 카드 줄 (그림자 카드 80×80). 같은 제조사를 다시 누르면 선택 해제.
class MakerRail extends StatelessWidget {
  const MakerRail({super.key, required this.data, required this.selected, required this.onSelect});

  final CarData data;
  final String? selected;
  final ValueChanged<String?> onSelect;

  @override
  Widget build(BuildContext context) {
    final makers = data.makerCounts();
    return SizedBox(
      height: 112,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
        itemCount: makers.length,
        separatorBuilder: (_, _) => const SizedBox(width: 10),
        itemBuilder: (context, i) {
          final entry = makers[i];
          final on = selected == entry.key;
          return _MakerCard(
            name: entry.key,
            count: entry.value,
            slug: data.logos[entry.key],
            selected: on,
            onTap: () => onSelect(on ? null : entry.key),
          );
        },
      ),
    );
  }
}

class _MakerCard extends StatelessWidget {
  const _MakerCard({required this.name, required this.count, required this.slug, required this.selected, required this.onTap});

  final String name;
  final int count;
  final String? slug;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      label: '$name $count대',
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            boxShadow: const [BoxShadow(color: Color(0x3D000000), blurRadius: 7, offset: Offset(0, 3))],
          ),
          foregroundDecoration: selected
              ? BoxDecoration(borderRadius: BorderRadius.circular(8), border: Border.all(color: AppColors.ink, width: 2))
              : null,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 40,
                height: 32,
                child: slug == null
                    ? CircleAvatar(backgroundColor: const Color(0xFFF4F4F4), child: Text(name.characters.first, style: const TextStyle(color: AppColors.ink, fontWeight: FontWeight.w600)))
                    : Image.asset('assets/logos/$slug.png', fit: BoxFit.contain),
              ),
              const SizedBox(height: 6),
              Text(name, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, height: 16 / 11, color: AppColors.ink)),
              Text('($count)', style: const TextStyle(fontSize: 10, height: 12 / 10, color: AppColors.sub)),
            ],
          ),
        ),
      ),
    );
  }
}
