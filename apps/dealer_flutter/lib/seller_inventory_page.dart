import 'package:flutter/material.dart';

enum InventoryStatus { active, review, sold }

class ManagedVehicle {
  const ManagedVehicle({
    required this.id,
    required this.title,
    required this.spec,
    required this.price,
    required this.image,
    required this.status,
    required this.views,
    required this.inquiries,
    required this.updated,
  });

  final int id;
  final String title;
  final String spec;
  final String price;
  final String image;
  final InventoryStatus status;
  final int views;
  final int inquiries;
  final String updated;
}

const managedVehicles = <ManagedVehicle>[
  ManagedVehicle(
    id: 1,
    title: '랜드로버 레인지로버 4세대 5.0 V8 SC LWB SV AB',
    spec: '2019 · 5.2만km · 가솔린',
    price: '가격 상담',
    image: 'assets/images/cars/range-rover.jpg',
    status: InventoryStatus.active,
    views: 328,
    inquiries: 2,
    updated: '5분 전 수정',
  ),
  ManagedVehicle(
    id: 2,
    title: 'BMW M3 6세대 M3 xDrive 컴페티션 M',
    spec: '2023 · 2.2만km · 가솔린',
    price: '9,595만원',
    image: 'assets/images/cars/bmw-m3.webp',
    status: InventoryStatus.review,
    views: 241,
    inquiries: 1,
    updated: '10분 전 등록',
  ),
  ManagedVehicle(
    id: 3,
    title: '포르쉐 타이칸 EV',
    spec: '2023 · 3만km · 전기',
    price: '12,690만원',
    image: 'assets/images/cars/porsche-taycan.webp',
    status: InventoryStatus.active,
    views: 197,
    inquiries: 0,
    updated: '17분 전 수정',
  ),
  ManagedVehicle(
    id: 4,
    title: '벤츠 GLS클래스 3세대 580 4매틱',
    spec: '2022 · 9.5만km · 가솔린',
    price: '7,575만원',
    image: 'assets/images/cars/mercedes-gls.webp',
    status: InventoryStatus.sold,
    views: 451,
    inquiries: 4,
    updated: '어제 판매완료',
  ),
];

class SellerInventoryPage extends StatefulWidget {
  const SellerInventoryPage({super.key});

  @override
  State<SellerInventoryPage> createState() => _SellerInventoryPageState();
}

class _SellerInventoryPageState extends State<SellerInventoryPage> {
  int summaryIndex = 0;
  int categoryIndex = 0;
  bool gridView = false;
  final selectedIds = <int>{};
  final searchController = TextEditingController();
  String query = '';

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  List<ManagedVehicle> get visibleVehicles {
    Iterable<ManagedVehicle> items = managedVehicles;
    switch (summaryIndex) {
      case 0:
        items = items.where((item) => item.status == InventoryStatus.active);
      case 1:
        items = items.where((item) => item.status == InventoryStatus.review);
      case 2:
        items = items.where((item) => item.inquiries > 0);
      case 3:
        items = items.where((item) => item.status == InventoryStatus.sold);
    }
    final normalized = query.trim().toLowerCase();
    if (normalized.isNotEmpty) {
      items = items.where(
        (item) =>
            item.title.toLowerCase().contains(normalized) ||
            item.spec.toLowerCase().contains(normalized),
      );
    }
    return items.toList();
  }

  void toast(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
  }

  void toggleAll(bool? value) {
    setState(() {
      if (value == true) {
        selectedIds.addAll(visibleVehicles.map((vehicle) => vehicle.id));
      } else {
        selectedIds.removeAll(visibleVehicles.map((vehicle) => vehicle.id));
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final visible = visibleVehicles;
    final allSelected =
        visible.isNotEmpty &&
        visible.every((item) => selectedIds.contains(item.id));
    final screenWidth = MediaQuery.sizeOf(context).width;
    final pageWidth = screenWidth > 720 ? 720.0 : screenWidth;

    return Scaffold(
      backgroundColor: const Color(0xFFF6F6F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0.5,
        leading: IconButton(
          tooltip: '뒤로가기',
          onPressed: () => Navigator.of(context).maybePop(),
          icon: const Icon(Icons.arrow_back_rounded),
        ),
        titleSpacing: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '매물 관리',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900),
            ),
            Text(
              '투제이모터웍스',
              style: TextStyle(fontSize: 11.5, color: Color(0xFF74777C)),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: '도움말',
            onPressed: () => toast('매물 관리 도움말을 준비 중입니다'),
            icon: const Icon(Icons.help_outline_rounded),
          ),
          PopupMenuButton<String>(
            tooltip: '관리 메뉴',
            onSelected: toast,
            itemBuilder: (_) => const [
              PopupMenuItem(value: '가격 일괄 수정', child: Text('가격 일괄 수정')),
              PopupMenuItem(value: '노출 현황 보기', child: Text('노출 현황 보기')),
              PopupMenuItem(value: '삭제 차량 관리', child: Text('삭제 차량 관리')),
            ],
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Center(
        child: SizedBox(
          width: pageWidth,
          child: CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: _SellerHeader(onRegister: () => toast('새 매물 등록을 시작합니다')),
              ),
              SliverToBoxAdapter(
                child: _SummaryStrip(
                  selectedIndex: summaryIndex,
                  onSelected: (index) => setState(() {
                    summaryIndex = index;
                    selectedIds.clear();
                  }),
                ),
              ),
              SliverPersistentHeader(
                pinned: true,
                delegate: _InventoryToolbarDelegate(
                  categoryIndex: categoryIndex,
                  onCategoryChanged: (index) =>
                      setState(() => categoryIndex = index),
                  controller: searchController,
                  onSearchChanged: (value) => setState(() => query = value),
                  gridView: gridView,
                  onViewChanged: (value) => setState(() => gridView = value),
                ),
              ),
              SliverToBoxAdapter(
                child: Container(
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 24,
                        height: 24,
                        child: Checkbox(
                          value: allSelected,
                          onChanged: toggleAll,
                          side: const BorderSide(color: Color(0xFF9B9EA3)),
                        ),
                      ),
                      const SizedBox(width: 9),
                      Text(
                        '전체 선택 · ${visible.length}대',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        selectedIds.isEmpty
                            ? '최근 수정순'
                            : '${selectedIds.length}대 선택',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: selectedIds.isEmpty
                              ? const Color(0xFF73767B)
                              : const Color(0xFF1E58A8),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (visible.isEmpty)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: _EmptyInventory(),
                )
              else if (gridView)
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 100),
                  sliver: SliverGrid.builder(
                    itemCount: visible.length,
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          mainAxisSpacing: 10,
                          crossAxisSpacing: 10,
                          childAspectRatio: 0.67,
                        ),
                    itemBuilder: (context, index) => _InventoryGridCard(
                      vehicle: visible[index],
                      selected: selectedIds.contains(visible[index].id),
                      onSelected: (value) => setState(() {
                        value
                            ? selectedIds.add(visible[index].id)
                            : selectedIds.remove(visible[index].id);
                      }),
                      onAction: toast,
                    ),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 100),
                  sliver: SliverList.separated(
                    itemCount: visible.length,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 10),
                    itemBuilder: (context, index) => _InventoryListCard(
                      vehicle: visible[index],
                      selected: selectedIds.contains(visible[index].id),
                      onSelected: (value) => setState(() {
                        value
                            ? selectedIds.add(visible[index].id)
                            : selectedIds.remove(visible[index].id);
                      }),
                      onAction: toast,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: Container(
          height: 66,
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          decoration: const BoxDecoration(
            color: Colors.white,
            border: Border(top: BorderSide(color: Color(0xFFE7E8EA))),
          ),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  selectedIds.isEmpty
                      ? '차량을 선택하면 일괄 관리할 수 있어요'
                      : '${selectedIds.length}대가 선택되었습니다',
                  style: const TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              FilledButton(
                onPressed: selectedIds.isEmpty
                    ? null
                    : () => toast('${selectedIds.length}대 일괄 관리 메뉴를 엽니다'),
                style: FilledButton.styleFrom(
                  minimumSize: const Size(112, 42),
                  backgroundColor: const Color(0xFF202124),
                  disabledBackgroundColor: const Color(0xFFE2E3E5),
                ),
                child: const Text('선택 차량 관리'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SellerHeader extends StatelessWidget {
  const _SellerHeader({required this.onRegister});
  final VoidCallback onRegister;

  @override
  Widget build(BuildContext context) => Container(
    color: Colors.white,
    padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
    child: Row(
      children: [
        const CircleAvatar(
          radius: 28,
          backgroundImage: AssetImage('assets/images/kim-taegyu.jpg'),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    '김태규',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
                  ),
                  SizedBox(width: 5),
                  DecoratedBox(
                    decoration: BoxDecoration(
                      color: Color(0xFF202124),
                      borderRadius: BorderRadius.all(Radius.circular(4)),
                    ),
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      child: Text(
                        '대표',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 3),
              Text(
                '서울오토갤러리 · (주)투제이모터웍스',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12, color: Color(0xFF74777C)),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        FilledButton.icon(
          onPressed: onRegister,
          icon: const Icon(Icons.add_rounded, size: 18),
          label: const Text('매물 등록'),
          style: FilledButton.styleFrom(
            minimumSize: const Size(104, 40),
            backgroundColor: const Color(0xFF202124),
            padding: const EdgeInsets.symmetric(horizontal: 12),
          ),
        ),
      ],
    ),
  );
}

class _SummaryStrip extends StatelessWidget {
  const _SummaryStrip({required this.selectedIndex, required this.onSelected});
  final int selectedIndex;
  final ValueChanged<int> onSelected;

  static const items = [
    ('판매중', '24'),
    ('검수 대기', '2'),
    ('구매 문의', '3'),
    ('판매완료', '12'),
  ];

  @override
  Widget build(BuildContext context) => Container(
    color: Colors.white,
    padding: const EdgeInsets.fromLTRB(12, 0, 12, 14),
    child: Row(
      children: List.generate(items.length, (index) {
        final selected = selectedIndex == index;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: index == items.length - 1 ? 0 : 7),
            child: InkWell(
              onTap: () => onSelected(index),
              borderRadius: BorderRadius.circular(10),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                padding: const EdgeInsets.symmetric(vertical: 11),
                decoration: BoxDecoration(
                  color: selected
                      ? const Color(0xFF202124)
                      : const Color(0xFFF4F4F5),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Column(
                  children: [
                    Text(
                      items[index].$2,
                      style: TextStyle(
                        color: selected
                            ? Colors.white
                            : const Color(0xFF202124),
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      items[index].$1,
                      style: TextStyle(
                        color: selected
                            ? const Color(0xFFE5E5E5)
                            : const Color(0xFF74777C),
                        fontSize: 10.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }),
    ),
  );
}

class _InventoryToolbarDelegate extends SliverPersistentHeaderDelegate {
  _InventoryToolbarDelegate({
    required this.categoryIndex,
    required this.onCategoryChanged,
    required this.controller,
    required this.onSearchChanged,
    required this.gridView,
    required this.onViewChanged,
  });

  final int categoryIndex;
  final ValueChanged<int> onCategoryChanged;
  final TextEditingController controller;
  final ValueChanged<String> onSearchChanged;
  final bool gridView;
  final ValueChanged<bool> onViewChanged;

  @override
  double get minExtent => 116;
  @override
  double get maxExtent => 116;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) => Material(
    color: Colors.white,
    elevation: overlapsContent ? 1 : 0,
    child: Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
      child: Column(
        children: [
          Row(
            children: [
              _CategoryChip(
                label: '승용 · SUV 24',
                selected: categoryIndex == 0,
                onTap: () => onCategoryChanged(0),
              ),
              const SizedBox(width: 8),
              _CategoryChip(
                label: '화물 · 특장 0',
                selected: categoryIndex == 1,
                onTap: () => onCategoryChanged(1),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 42,
                  child: TextField(
                    controller: controller,
                    onChanged: onSearchChanged,
                    textInputAction: TextInputAction.search,
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      prefixIcon: const Icon(Icons.search_rounded, size: 20),
                      hintText: '차량명 또는 연식 검색',
                      filled: true,
                      fillColor: const Color(0xFFF4F4F5),
                      contentPadding: EdgeInsets.zero,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(9),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _SquareToolButton(
                tooltip: '목록 보기',
                selected: !gridView,
                icon: Icons.view_agenda_outlined,
                onTap: () => onViewChanged(false),
              ),
              const SizedBox(width: 4),
              _SquareToolButton(
                tooltip: '격자 보기',
                selected: gridView,
                icon: Icons.grid_view_rounded,
                onTap: () => onViewChanged(true),
              ),
            ],
          ),
        ],
      ),
    ),
  );

  @override
  bool shouldRebuild(covariant _InventoryToolbarDelegate oldDelegate) =>
      oldDelegate.categoryIndex != categoryIndex ||
      oldDelegate.gridView != gridView;
}

class _CategoryChip extends StatelessWidget {
  const _CategoryChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(18),
    child: Container(
      height: 32,
      padding: const EdgeInsets.symmetric(horizontal: 13),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: selected ? const Color(0xFF202124) : Colors.white,
        border: Border.all(
          color: selected ? const Color(0xFF202124) : const Color(0xFFD8D9DC),
        ),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: selected ? Colors.white : const Color(0xFF55585D),
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
    ),
  );
}

class _SquareToolButton extends StatelessWidget {
  const _SquareToolButton({
    required this.tooltip,
    required this.selected,
    required this.icon,
    required this.onTap,
  });
  final String tooltip;
  final bool selected;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Tooltip(
    message: tooltip,
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF202124) : Colors.white,
          border: Border.all(
            color: selected ? const Color(0xFF202124) : const Color(0xFFD8D9DC),
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          icon,
          size: 20,
          color: selected ? Colors.white : const Color(0xFF66696E),
        ),
      ),
    ),
  );
}

class _InventoryListCard extends StatelessWidget {
  const _InventoryListCard({
    required this.vehicle,
    required this.selected,
    required this.onSelected,
    required this.onAction,
  });

  final ManagedVehicle vehicle;
  final bool selected;
  final ValueChanged<bool> onSelected;
  final ValueChanged<String> onAction;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      color: Colors.white,
      border: Border.all(
        color: selected ? const Color(0xFF202124) : const Color(0xFFE5E6E8),
      ),
      borderRadius: BorderRadius.circular(12),
      boxShadow: const [
        BoxShadow(
          color: Color(0x0A000000),
          blurRadius: 8,
          offset: Offset(0, 2),
        ),
      ],
    ),
    child: Padding(
      padding: const EdgeInsets.all(11),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(9),
                    child: Image.asset(
                      vehicle.image,
                      width: 126,
                      height: 116,
                      fit: BoxFit.cover,
                    ),
                  ),
                  Positioned(
                    top: 6,
                    left: 6,
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: Checkbox(
                          value: selected,
                          onChanged: (value) => onSelected(value ?? false),
                          side: const BorderSide(color: Color(0xFF9B9EA3)),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 6,
                    bottom: 6,
                    child: Container(
                      padding: const EdgeInsets.all(5),
                      decoration: BoxDecoration(
                        color: const Color(0xCC202124),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: const Icon(
                        Icons.photo_camera_outlined,
                        size: 15,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 11),
              Expanded(
                child: SizedBox(
                  height: 116,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          _StatusBadge(status: vehicle.status),
                          const Spacer(),
                          Text(
                            vehicle.updated,
                            style: const TextStyle(
                              fontSize: 10.5,
                              color: Color(0xFF8A8D92),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        vehicle.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 14,
                          height: 1.24,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        vehicle.spec,
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF74777C),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        vehicle.price,
                        style: const TextStyle(
                          fontSize: 15.5,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _Metric(
                icon: Icons.visibility_outlined,
                label: '조회 ${vehicle.views}',
              ),
              const SizedBox(width: 14),
              _Metric(
                icon: Icons.chat_bubble_outline_rounded,
                label: '문의 ${vehicle.inquiries}',
              ),
              const Spacer(),
              TextButton(
                onPressed: () => onAction('${vehicle.title} 정보 수정'),
                child: const Text('정보 수정'),
              ),
              const SizedBox(width: 3),
              OutlinedButton(
                onPressed: () => onAction('${vehicle.title} 관리 메뉴'),
                child: const Text('관리'),
              ),
            ],
          ),
        ],
      ),
    ),
  );
}

class _InventoryGridCard extends StatelessWidget {
  const _InventoryGridCard({
    required this.vehicle,
    required this.selected,
    required this.onSelected,
    required this.onAction,
  });

  final ManagedVehicle vehicle;
  final bool selected;
  final ValueChanged<bool> onSelected;
  final ValueChanged<String> onAction;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: () => onAction('${vehicle.title} 관리 메뉴'),
    borderRadius: BorderRadius.circular(12),
    child: DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(
          color: selected ? const Color(0xFF202124) : const Color(0xFFE5E6E8),
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(11),
                  ),
                  child: Image.asset(vehicle.image, fit: BoxFit.cover),
                ),
                Positioned(
                  top: 6,
                  left: 6,
                  child: SizedBox(
                    width: 26,
                    height: 26,
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Checkbox(
                        value: selected,
                        onChanged: (value) => onSelected(value ?? false),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _StatusBadge(status: vehicle.status),
                const SizedBox(height: 7),
                Text(
                  vehicle.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.25,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  vehicle.spec,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 10.5,
                    color: Color(0xFF777A80),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  vehicle.price,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final InventoryStatus status;

  @override
  Widget build(BuildContext context) {
    final (label, color, background) = switch (status) {
      InventoryStatus.active => (
        '판매중',
        const Color(0xFF176B45),
        const Color(0xFFE9F7F0),
      ),
      InventoryStatus.review => (
        '검수 대기',
        const Color(0xFFC63A37),
        const Color(0xFFFFECEB),
      ),
      InventoryStatus.sold => (
        '판매완료',
        const Color(0xFF686B70),
        const Color(0xFFF0F1F2),
      ),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(5),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10.5,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }
}

class _Metric extends StatelessWidget {
  const _Metric({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      Icon(icon, size: 15, color: const Color(0xFF777A80)),
      const SizedBox(width: 4),
      Text(
        label,
        style: const TextStyle(fontSize: 11, color: Color(0xFF66696E)),
      ),
    ],
  );
}

class _EmptyInventory extends StatelessWidget {
  const _EmptyInventory();

  @override
  Widget build(BuildContext context) => Container(
    color: const Color(0xFFF6F6F7),
    alignment: Alignment.topCenter,
    padding: const EdgeInsets.only(top: 60),
    child: const Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.directions_car_outlined, size: 44, color: Color(0xFFB1B3B7)),
        SizedBox(height: 12),
        Text(
          '조건에 맞는 매물이 없습니다',
          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
        ),
        SizedBox(height: 5),
        Text(
          '검색어나 상태 필터를 다시 확인해 주세요',
          style: TextStyle(fontSize: 12, color: Color(0xFF777A80)),
        ),
      ],
    ),
  );
}
