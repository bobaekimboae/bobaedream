import 'package:flutter/material.dart';

import '../data/repository.dart';
import '../models/car.dart';
import '../theme.dart';
import '../widgets/car_card.dart';
import '../widgets/maker_rail.dart';
import 'detail_screen.dart';

class ListScreen extends StatefulWidget {
  const ListScreen({super.key, required this.data});

  final CarData data;

  @override
  State<ListScreen> createState() => _ListScreenState();
}

class _ListScreenState extends State<ListScreen> {
  String? _maker;
  final Set<int> _favorites = {};

  List<Car> get _cars => _maker == null ? widget.data.cars : widget.data.cars.where((c) => c.maker == _maker).toList();

  @override
  Widget build(BuildContext context) {
    final cars = _cars;
    return Scaffold(
      appBar: AppBar(
        title: const Text('서울오토갤러리', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        centerTitle: false,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: AppColors.line),
        ),
      ),
      body: CustomScrollView(slivers: [
        SliverToBoxAdapter(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Text('서울 서초구 수입차 전문 매매단지', style: TextStyle(fontSize: 13, color: AppColors.sub)),
            ),
            MakerRail(data: widget.data, selected: _maker, onSelect: (m) => setState(() => _maker = m)),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              child: Text(_maker == null ? '전체 ${cars.length}대' : '$_maker ${cars.length}대', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.ink)),
            ),
          ]),
        ),
        if (cars.isEmpty)
          const SliverFillRemaining(hasScrollBody: false, child: Center(child: Text('조건에 맞는 차량이 없어요', style: TextStyle(color: AppColors.muted))))
        else
          SliverList.builder(
            itemCount: cars.length,
            itemBuilder: (context, i) {
              final car = cars[i];
              return CarCard(
                car: car,
                favorite: _favorites.contains(car.id),
                onFavorite: () => setState(() => _favorites.contains(car.id) ? _favorites.remove(car.id) : _favorites.add(car.id)),
                onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => DetailScreen(car: car))),
              );
            },
          ),
      ]),
    );
  }
}
