import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'seller_inventory_page.dart';

const _iconRoot = 'assets/icons';
const _followIcon = '$_iconRoot/chotot/chotot-list-detail-follow.svg';
const _followingIcon =
    '$_iconRoot/chotot/chotot-listing-register-check-mark.svg';
const _chatIcon = '$_iconRoot/chotot/chotot-list-detail-chat.svg';
const _verifiedIcon =
    '$_iconRoot/chotot/chotot-list-detail-verified-dealer-wavy-badge.svg';
const _locationIcon = '$_iconRoot/chotot/chotot-profile-location.svg';
const _reviewStarIcon = '$_iconRoot/chotot/chotot-list-detail-review-star.svg';
const _favoriteIcon = '$_iconRoot/chotot/chotot-common-favorite.svg';
const _favoriteSelectedIcon =
    '$_iconRoot/chotot/chotot-common-favorite-selected.svg';
const _phoneIcon = '$_iconRoot/dealer-profile/phone.svg';
const _dealerIcon = '$_iconRoot/dealer-profile/dealership.svg';
const _dealershipIcon = '$_iconRoot/dealer-profile/dealership-building.png';

class _AssetIcon extends StatelessWidget {
  const _AssetIcon({required this.asset, required this.size, this.color});

  final String asset;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    if (asset.endsWith('.svg')) {
      return SvgPicture.asset(
        asset,
        width: size,
        height: size,
        fit: BoxFit.contain,
        colorFilter: color == null
            ? null
            : ColorFilter.mode(color!, BlendMode.srcIn),
      );
    }

    return Image.asset(
      asset,
      width: size,
      height: size,
      fit: BoxFit.contain,
      color: color,
      colorBlendMode: color == null ? null : BlendMode.srcIn,
      filterQuality: FilterQuality.high,
    );
  }
}

void main() => runApp(const DealerApp());

class DealerApp extends StatelessWidget {
  const DealerApp({super.key, this.home});

  final Widget? home;

  @override
  Widget build(BuildContext context) {
    const ink = Color(0xFF17181B);
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: '김태규 딜러',
      theme: ThemeData(
        useMaterial3: true,
        scaffoldBackgroundColor: Colors.white,
        colorScheme: ColorScheme.fromSeed(
          seedColor: ink,
          brightness: Brightness.light,
          primary: ink,
          surface: Colors.white,
        ),
        fontFamily: 'Pretendard',
        fontFamilyFallback: const [
          'Pretendard',
          'Noto Sans KR',
          'Apple SD Gothic Neo',
          'Malgun Gothic',
        ],
        textTheme: const TextTheme(
          bodyMedium: TextStyle(color: ink, height: 1.38),
          titleMedium: TextStyle(color: ink, fontWeight: FontWeight.w700),
        ),
      ),
      home:
          home ??
          (Uri.base.queryParameters['screen'] == 'inventory'
              ? const SellerInventoryPage()
              : const DealerProfilePage()),
    );
  }
}

enum DealerTab {
  home,
  listings,
  community,
  quote,
  reviews,
  social,
  team,
  about,
}

class DealerCar {
  const DealerCar({
    required this.title,
    required this.spec,
    required this.price,
    required this.image,
    required this.posted,
    required this.dealer,
  });
  final String title;
  final String spec;
  final String price;
  final String image;
  final String posted;
  final String dealer;
}

const dealerCars = <DealerCar>[
  DealerCar(
    title: '랜드로버 레인지로버 4세대 5.0 V8 SC LWB SV AB',
    spec: '2019 · 5.2만km · 가솔린',
    price: '가격 상담',
    image: 'assets/images/cars/range-rover.jpg',
    posted: '5분 전',
    dealer: '김태규 투제이모터웍스',
  ),
  DealerCar(
    title: 'BMW M3 6세대 M3 xDrive 컴페티션 M',
    spec: '2023 · 2.2만km · 가솔린',
    price: '9,595만원',
    image: 'assets/images/cars/bmw-m3.webp',
    posted: '10분 전',
    dealer: '박상용 디앤디플러스',
  ),
  DealerCar(
    title: '포르쉐 타이칸 EV',
    spec: '2023 · 3만km · 전기',
    price: '12,690만원',
    image: 'assets/images/cars/porsche-taycan.webp',
    posted: '17분 전',
    dealer: '권재한 서울자동차선물거래소',
  ),
  DealerCar(
    title: '벤츠 GLS클래스 3세대 580 4매틱',
    spec: '2022 · 9.5만km · 가솔린',
    price: '7,575만원',
    image: 'assets/images/cars/mercedes-gls.webp',
    posted: '24분 전',
    dealer: '강홍구 브로엠와이',
  ),
];

class DealerProfilePage extends StatefulWidget {
  const DealerProfilePage({super.key});

  @override
  State<DealerProfilePage> createState() => _DealerProfilePageState();
}

class _DealerProfilePageState extends State<DealerProfilePage> {
  DealerTab activeTab = DealerTab.home;
  bool following = true;
  bool showFullBio = false;
  bool showSold = false;

  void toast(String text) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(text),
          behavior: SnackBarBehavior.floating,
          width: 320,
          duration: const Duration(seconds: 2),
        ),
      );
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final pageWidth = screenWidth > 720 ? 720.0 : screenWidth;
    return Scaffold(
      body: Center(
        child: SizedBox(
          width: pageWidth,
          child: CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                backgroundColor: Colors.white,
                surfaceTintColor: Colors.white,
                elevation: 0,
                scrolledUnderElevation: 0.6,
                leading: IconButton(
                  tooltip: '뒤로가기',
                  onPressed: () => toast('이전 화면으로 이동합니다'),
                  icon: const Icon(Icons.arrow_back_rounded, size: 25),
                ),
                titleSpacing: 0,
                title: const Text(
                  '투제이모터웍스',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                ),
                actions: [
                  IconButton(
                    tooltip: '차량 검색',
                    onPressed: () => _showSearch(context),
                    icon: const Icon(Icons.search_rounded, size: 27),
                  ),
                  IconButton(
                    tooltip: '더보기',
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => const SellerInventoryPage(),
                      ),
                    ),
                    icon: const Icon(Icons.more_vert_rounded),
                  ),
                  const SizedBox(width: 4),
                ],
              ),
              SliverToBoxAdapter(
                child: DealerHero(
                  following: following,
                  showFullBio: showFullBio,
                  onToggleFollow: () => setState(() => following = !following),
                  onToggleBio: () => setState(() => showFullBio = !showFullBio),
                  onChat: () => toast('김태규 딜러와 채팅을 시작합니다'),
                  onCall: () => toast('02-2059-5211로 연결합니다'),
                  onQuote: () => setState(() => activeTab = DealerTab.quote),
                  onReviews: () =>
                      setState(() => activeTab = DealerTab.reviews),
                ),
              ),
              SliverPersistentHeader(
                pinned: true,
                delegate: DealerTabsDelegate(
                  activeTab: activeTab,
                  onSelected: (tab) => setState(() => activeTab = tab),
                ),
              ),
              SliverToBoxAdapter(child: _tabBody()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _tabBody() {
    switch (activeTab) {
      case DealerTab.home:
      case DealerTab.listings:
        return ListingsView(
          home: activeTab == DealerTab.home,
          sold: showSold,
          onModeChanged: (value) => setState(() => showSold = value),
          onFavorite: (car) => toast('${car.title}을 관심 차량에 저장했습니다'),
          onOpen: (car) => toast('${car.title} 상세 페이지로 이동합니다'),
        );
      case DealerTab.community:
        return CommunityView(onPressed: toast);
      case DealerTab.quote:
        return QuoteView(onSubmit: () => toast('무료 견적 신청이 접수되었습니다'));
      case DealerTab.reviews:
        return const ReviewsView();
      case DealerTab.social:
        return SocialView(onPressed: toast);
      case DealerTab.team:
        return const TeamView();
      case DealerTab.about:
        return const AboutView();
    }
  }

  Future<void> _showSearch(BuildContext context) async {
    final controller = TextEditingController();
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      showDragHandle: true,
      builder: (context) => Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          0,
          20,
          MediaQuery.viewInsetsOf(context).bottom + 24,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              '판매 차량 검색',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 14),
            TextField(
              controller: controller,
              autofocus: true,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search_rounded),
                hintText: '브랜드나 모델을 입력하세요',
                border: OutlineInputBorder(),
              ),
              onSubmitted: (value) {
                Navigator.pop(context);
                toast(value.isEmpty ? '검색어를 입력해 주세요' : '“$value” 매물을 검색합니다');
              },
            ),
            const SizedBox(height: 14),
          ],
        ),
      ),
    );
    controller.dispose();
  }
}

class DealerHero extends StatelessWidget {
  const DealerHero({
    required this.following,
    required this.showFullBio,
    required this.onToggleFollow,
    required this.onToggleBio,
    required this.onChat,
    required this.onCall,
    required this.onQuote,
    required this.onReviews,
    super.key,
  });
  final bool following;
  final bool showFullBio;
  final VoidCallback onToggleFollow;
  final VoidCallback onToggleBio;
  final VoidCallback onChat;
  final VoidCallback onCall;
  final VoidCallback onQuote;
  final VoidCallback onReviews;

  @override
  Widget build(BuildContext context) {
    final compact = MediaQuery.sizeOf(context).width < 410;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  height: compact ? 104 : 128,
                  width: double.infinity,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Image.asset(
                        'assets/images/ferrari-f80.jpg',
                        fit: BoxFit.cover,
                      ),
                      const DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Color(0xD914171A),
                              Color(0x4414171A),
                              Color(0xBB14171A),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              Positioned(
                left: 16,
                bottom: -40,
                child: Container(
                  width: 88,
                  height: 88,
                  padding: const EdgeInsets.all(3),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: ClipOval(
                    child: Image.asset(
                      'assets/images/kim-taegyu.jpg',
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
              const Positioned(
                left: 120,
                right: 12,
                bottom: 17,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '투제이모터웍스',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      '수입차 전문 매매',
                      style: TextStyle(
                        color: Color(0xFFE7E7E7),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 48, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Text(
                    '김태규',
                    style: TextStyle(
                      fontSize: 25,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.6,
                    ),
                  ),
                  SizedBox(width: 5),
                  _AssetIcon(asset: _verifiedIcon, size: 19),
                ],
              ),
              const SizedBox(height: 13),
              const Row(
                children: [
                  _Stat(label: '판매중', value: '24'),
                  _Stat(label: '판매완료', value: '12'),
                  _Stat(label: '팔로워', value: '426'),
                ],
              ),
              const SizedBox(height: 15),
              const Text(
                '(주)투제이모터웍스 · 대표',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 5),
              GestureDetector(
                onTap: onToggleBio,
                child: Text.rich(
                  TextSpan(
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.45,
                      color: Color(0xFF34363A),
                    ),
                    children: [
                      TextSpan(
                        text: showFullBio
                            ? '서울오토갤러리 은관에 위치한 (주)투제이모터웍스 대표 김태규입니다. 모든 차량의 상태와 이력을 직접 확인하고, 정확한 정보와 투명한 상담을 약속드립니다. '
                            : '서울오토갤러리 은관에 위치한 수입차 전문 딜러입니다. 정확한 정보와 투명한 상담을 약속드립니다. ',
                      ),
                      TextSpan(
                        text: showFullBio ? '접기' : '더보기',
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF17181B),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 15),
              Row(
                children: [
                  Expanded(
                    child: _ActionButton(
                      label: following ? '팔로잉' : '팔로우',
                      iconAsset: following ? _followingIcon : _followIcon,
                      onTap: onToggleFollow,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _ActionButton(
                      label: '채팅',
                      iconAsset: _chatIcon,
                      onTap: onChat,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _ActionButton(
                      label: '전화',
                      iconAsset: _phoneIcon,
                      onTap: onCall,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 15),
              InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: onReviews,
                child: const Padding(
                  padding: EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Text(
                        '4.8',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                      SizedBox(width: 6),
                      _Stars(),
                      SizedBox(width: 8),
                      Text(
                        '리뷰 3',
                        style: TextStyle(
                          decoration: TextDecoration.underline,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 13),
              const _InfoLine(iconAsset: _dealerIcon, text: '딜러 경력 7년'),
              const _InfoLine(iconAsset: _phoneIcon, text: '02-2059-5211'),
              const _InfoLine(
                iconAsset: _locationIcon,
                text: '서울 서초구 양재대로11길 36, 은관 421호',
              ),
              const _InfoLine(
                iconAsset: _dealershipIcon,
                text: '서울오토갤러리 · (주)투제이모터웍스',
              ),
              const SizedBox(height: 7),
              Material(
                color: const Color(0xFFF5F5F6),
                borderRadius: BorderRadius.circular(11),
                child: InkWell(
                  onTap: onQuote,
                  borderRadius: BorderRadius.circular(11),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 13,
                    ),
                    child: Row(
                      children: [
                        const Expanded(
                          child: Text(
                            '내 차 판매가격, 무료로 확인해 보세요',
                            style: TextStyle(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFF202124),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: const Text(
                            '견적신청',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 12.5,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Color(0xFF6F7277)),
        ),
      ],
    ),
  );
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.iconAsset,
    required this.onTap,
  });
  final String label;
  final String iconAsset;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => SizedBox(
    height: 38,
    child: OutlinedButton.icon(
      onPressed: onTap,
      icon: _AssetIcon(
        asset: iconAsset,
        size: 17,
        color: const Color(0xFF202124),
      ),
      label: Text(
        label,
        maxLines: 1,
        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800),
      ),
      style: OutlinedButton.styleFrom(
        foregroundColor: const Color(0xFF202124),
        padding: const EdgeInsets.symmetric(horizontal: 8),
        side: const BorderSide(color: Color(0xFFD7D9DC)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    ),
  );
}

class _Stars extends StatelessWidget {
  const _Stars();
  @override
  Widget build(BuildContext context) => const Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      _AssetIcon(asset: _reviewStarIcon, size: 15, color: Color(0xFFF8BA02)),
      SizedBox(width: 2),
      _AssetIcon(asset: _reviewStarIcon, size: 15, color: Color(0xFFF8BA02)),
      SizedBox(width: 2),
      _AssetIcon(asset: _reviewStarIcon, size: 15, color: Color(0xFFF8BA02)),
      SizedBox(width: 2),
      _AssetIcon(asset: _reviewStarIcon, size: 15, color: Color(0xFFF8BA02)),
      SizedBox(width: 2),
      _AssetIcon(asset: _reviewStarIcon, size: 15, color: Color(0xFFD9D9D9)),
    ],
  );
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({required this.iconAsset, required this.text});
  final String iconAsset;
  final String text;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 5.5),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _AssetIcon(asset: iconAsset, size: 20, color: const Color(0xFF34363A)),
        const SizedBox(width: 11),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 13.5, color: Color(0xFF3A3C40)),
          ),
        ),
      ],
    ),
  );
}

class DealerTabsDelegate extends SliverPersistentHeaderDelegate {
  DealerTabsDelegate({required this.activeTab, required this.onSelected});
  final DealerTab activeTab;
  final ValueChanged<DealerTab> onSelected;
  static const labels = <DealerTab, String>{
    DealerTab.home: '홈',
    DealerTab.listings: '판매차량',
    DealerTab.community: '커뮤니티',
    DealerTab.quote: '내차견적',
    DealerTab.reviews: '리뷰',
    DealerTab.social: 'SNS',
    DealerTab.team: '소속딜러',
    DealerTab.about: '소개',
  };
  @override
  double get minExtent => 49;
  @override
  double get maxExtent => 49;
  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) => Material(
    color: Colors.white,
    elevation: overlapsContent ? 1 : 0,
    child: DecoratedBox(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFE9EAEC))),
      ),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        children: labels.entries.map((entry) {
          final selected = entry.key == activeTab;
          return InkWell(
            onTap: () => onSelected(entry.key),
            child: Container(
              constraints: const BoxConstraints(minWidth: 64),
              margin: const EdgeInsets.symmetric(horizontal: 2),
              padding: const EdgeInsets.symmetric(horizontal: 7),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: selected
                        ? const Color(0xFF17181B)
                        : Colors.transparent,
                    width: 3,
                  ),
                ),
              ),
              alignment: Alignment.center,
              child: Text(
                entry.value,
                style: TextStyle(
                  color: selected
                      ? const Color(0xFF17181B)
                      : const Color(0xFF66696E),
                  fontSize: 13.5,
                  fontWeight: selected ? FontWeight.w900 : FontWeight.w600,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    ),
  );
  @override
  bool shouldRebuild(covariant DealerTabsDelegate oldDelegate) =>
      oldDelegate.activeTab != activeTab;
}

class ListingsView extends StatelessWidget {
  const ListingsView({
    required this.home,
    required this.sold,
    required this.onModeChanged,
    required this.onFavorite,
    required this.onOpen,
    super.key,
  });
  final bool home;
  final bool sold;
  final ValueChanged<bool> onModeChanged;
  final ValueChanged<DealerCar> onFavorite;
  final ValueChanged<DealerCar> onOpen;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 18, 16, 36),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (home) ...[
          const Text(
            '김태규 딜러의 추천 차량',
            style: TextStyle(fontSize: 19, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 4),
          const Text(
            '직접 확인한 수입차 매물을 빠르게 만나보세요.',
            style: TextStyle(fontSize: 13, color: Color(0xFF71747A)),
          ),
          const SizedBox(height: 15),
        ],
        Row(
          children: [
            _ModeChip(
              label: '판매중 (24)',
              selected: !sold,
              onTap: () => onModeChanged(false),
            ),
            const SizedBox(width: 8),
            _ModeChip(
              label: '판매완료 (12)',
              selected: sold,
              onTap: () => onModeChanged(true),
            ),
          ],
        ),
        const SizedBox(height: 14),
        if (!sold)
          ...dealerCars.map(
            (car) => CarCard(
              car: car,
              onFavorite: () => onFavorite(car),
              onOpen: () => onOpen(car),
            ),
          )
        else
          ...const [
            ('BMW X5 xDrive40i M 스포츠', '3일 전'),
            ('벤츠 GLE 450 4매틱', '1개월 전'),
            ('포르쉐 카이엔 3.0', '2개월 전'),
            ('BMW 740Li xDrive', '3개월 전'),
          ].map(
            (item) => ListTile(
              contentPadding: const EdgeInsets.symmetric(vertical: 4),
              leading: const CircleAvatar(
                backgroundColor: Color(0xFFF0F1F2),
                child: Icon(
                  Icons.directions_car_outlined,
                  color: Color(0xFF4B4E53),
                ),
              ),
              title: Text(
                item.$1,
                style: const TextStyle(fontWeight: FontWeight.w800),
              ),
              subtitle: Text('${item.$2} 판매완료'),
              trailing: const Icon(Icons.chevron_right_rounded),
            ),
          ),
      ],
    ),
  );
}

class _ModeChip extends StatelessWidget {
  const _ModeChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final String label;
  final bool selected;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => ActionChip(
    onPressed: onTap,
    backgroundColor: selected
        ? const Color(0xFF202124)
        : const Color(0xFFF4F4F5),
    side: BorderSide(
      color: selected ? const Color(0xFF202124) : const Color(0xFFE5E6E8),
    ),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
    label: Text(
      label,
      style: TextStyle(
        color: selected ? Colors.white : const Color(0xFF3A3C40),
        fontWeight: FontWeight.w800,
      ),
    ),
  );
}

class CarCard extends StatefulWidget {
  const CarCard({
    required this.car,
    required this.onFavorite,
    required this.onOpen,
    super.key,
  });
  final DealerCar car;
  final VoidCallback onFavorite;
  final VoidCallback onOpen;
  @override
  State<CarCard> createState() => _CarCardState();
}

class _CarCardState extends State<CarCard> {
  bool favorite = false;
  @override
  Widget build(BuildContext context) => InkWell(
    onTap: widget.onOpen,
    borderRadius: BorderRadius.circular(12),
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFFEBECEE))),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(9),
                child: Image.asset(
                  widget.car.image,
                  width: 142,
                  height: 126,
                  fit: BoxFit.cover,
                ),
              ),
              Positioned(
                left: 8,
                bottom: 7,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.64),
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: Text(
                    widget.car.posted,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10.5,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 13),
          Expanded(
            child: SizedBox(
              height: 126,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.car.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 15.5,
                      height: 1.25,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const SizedBox(height: 5),
                  Text(
                    widget.car.spec,
                    style: const TextStyle(
                      fontSize: 12.5,
                      color: Color(0xFF66696E),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.car.price,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      const _AssetIcon(
                        asset: _locationIcon,
                        size: 14,
                        color: Color(0xFF9A9DA2),
                      ),
                      const SizedBox(width: 3),
                      const Expanded(
                        child: Text(
                          '서울 서초구 · 서울오토갤러리',
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11,
                            color: Color(0xFF8A8D92),
                          ),
                        ),
                      ),
                      InkResponse(
                        onTap: () {
                          setState(() => favorite = !favorite);
                          widget.onFavorite();
                        },
                        child: _AssetIcon(
                          asset: favorite
                              ? _favoriteSelectedIcon
                              : _favoriteIcon,
                          size: 22,
                          color: favorite ? null : const Color(0xFF777A80),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

class CommunityView extends StatelessWidget {
  const CommunityView({required this.onPressed, super.key});
  final ValueChanged<String> onPressed;
  @override
  Widget build(BuildContext context) {
    final posts = [
      (
        '차량 소개',
        'BMW M3 xDrive 컴페티션 입고 안내',
        '관리 상태와 주요 옵션을 직접 확인했습니다.',
        '2시간 전 · 조회 128',
      ),
      (
        '관리 팁',
        '수입차 장기 보관 전 확인할 세 가지',
        '배터리와 타이어 공기압, 실내 습도를 점검해 보세요.',
        '1일 전 · 조회 246',
      ),
      (
        '상담 후기',
        '멀리서 방문해 주신 고객님 출고 후기',
        '차량 이력과 상품화 과정을 함께 확인했습니다.',
        '3일 전 · 조회 193',
      ),
    ];
    return SectionShell(
      title: '커뮤니티',
      subtitle: '김태규 딜러의 차량 소식과 관리 팁',
      child: Column(
        children: posts
            .map(
              (post) => InkWell(
                onTap: () => onPressed('${post.$2} 게시물을 엽니다'),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: const BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: Color(0xFFEAEBED)),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post.$1,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF287CF2),
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        post.$2,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        post.$3,
                        style: const TextStyle(
                          fontSize: 13.5,
                          color: Color(0xFF575A60),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        post.$4,
                        style: const TextStyle(
                          fontSize: 11.5,
                          color: Color(0xFF92959A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class QuoteView extends StatefulWidget {
  const QuoteView({required this.onSubmit, super.key});
  final VoidCallback onSubmit;
  @override
  State<QuoteView> createState() => _QuoteViewState();
}

class _QuoteViewState extends State<QuoteView> {
  final model = TextEditingController();
  final phone = TextEditingController();
  @override
  void dispose() {
    model.dispose();
    phone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => SectionShell(
    title: '내차 무료 견적',
    subtitle: '차량 정보를 남기면 김태규 딜러가 직접 연락드립니다.',
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          controller: model,
          decoration: const InputDecoration(
            labelText: '차종 / 연식',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: phone,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            labelText: '연락처',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 14),
        FilledButton(
          onPressed: widget.onSubmit,
          style: FilledButton.styleFrom(
            minimumSize: const Size.fromHeight(48),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(9),
            ),
          ),
          child: const Text(
            '무료 견적 신청',
            style: TextStyle(fontWeight: FontWeight.w900),
          ),
        ),
      ],
    ),
  );
}

class ReviewsView extends StatelessWidget {
  const ReviewsView({super.key});
  @override
  Widget build(BuildContext context) {
    const reviews = [
      ('김**', '구매자', '벤츠 GLS클래스 3세대', '차량 상태와 이력을 꼼꼼하게 설명해 주셔서 믿고 구매했습니다.', 4),
      ('박**', '구매자', '벤츠 E클래스 5세대', '문의부터 출고까지 빠르고 친절했습니다.', 5),
      ('이**', '판매자', '벤츠 S클래스 7세대', '정확한 시세 안내와 깔끔한 거래가 좋았습니다.', 5),
    ];
    return SectionShell(
      title: '4.8 ★ 매우 만족',
      subtitle: '3명의 이용자 평가',
      child: Column(
        children: reviews
            .map(
              (review) => Container(
                padding: const EdgeInsets.symmetric(vertical: 15),
                decoration: const BoxDecoration(
                  border: Border(bottom: BorderSide(color: Color(0xFFEAEBED))),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const CircleAvatar(
                      backgroundColor: Color(0xFFF0F1F2),
                      child: Icon(
                        Icons.person_outline_rounded,
                        color: Color(0xFF76797E),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${review.$1} · ${review.$2}',
                            style: const TextStyle(fontWeight: FontWeight.w800),
                          ),
                          Text(
                            '★' * review.$5,
                            style: const TextStyle(color: Color(0xFFFFA000)),
                          ),
                          Text(
                            review.$3,
                            style: const TextStyle(
                              fontSize: 12.5,
                              color: Color(0xFF777A80),
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            review.$4,
                            style: const TextStyle(fontSize: 13.5),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }
}

class SocialView extends StatelessWidget {
  const SocialView({required this.onPressed, super.key});
  final ValueChanged<String> onPressed;
  @override
  Widget build(BuildContext context) {
    final channels = [
      ('$_iconRoot/dealer-profile/instagram.svg', '인스타그램', '신규 매물과 출고 소식'),
      ('$_iconRoot/dealer-profile/youtube.svg', '유튜브', '차량 리뷰 영상'),
      ('$_iconRoot/dealer-profile/facebook.svg', '페이스북', '투제이모터웍스 소식'),
      ('$_iconRoot/dealer-profile/tiktok.svg', '틱톡', '수입차 숏폼'),
    ];
    return SectionShell(
      title: 'SNS',
      subtitle: '투제이모터웍스의 최신 콘텐츠',
      child: Column(
        children: channels
            .map(
              (item) => ListTile(
                onTap: () => onPressed('${item.$2} 채널을 엽니다'),
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: const Color(0xFFF2F3F4),
                  child: _AssetIcon(
                    asset: item.$1,
                    size: 22,
                    color: const Color(0xFF232529),
                  ),
                ),
                title: Text(
                  item.$2,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                subtitle: Text(item.$3),
                trailing: const Icon(Icons.open_in_new_rounded, size: 20),
              ),
            )
            .toList(),
      ),
    );
  }
}

class TeamView extends StatelessWidget {
  const TeamView({super.key});
  @override
  Widget build(BuildContext context) {
    const people = [
      ('김태규', '대표 · 종사원번호 26-003-00097'),
      ('김민석', '인증딜러 · 종사원번호 26-003-00108'),
      ('박명주', '인증딜러 · 종사원번호 26-003-00117'),
      ('이민규', '인증딜러 · 종사원번호 26-003-00107'),
    ];
    return SectionShell(
      title: '소속 딜러',
      subtitle: '(주)투제이모터웍스 · 서울오토갤러리',
      child: Column(
        children: people
            .map(
              (person) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: const Color(0xFFF0F1F2),
                  child: Text(
                    person.$1.substring(0, 1),
                    style: const TextStyle(
                      color: Color(0xFF34363A),
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
                title: Text(
                  person.$1,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
                subtitle: Text(person.$2),
                trailing: const Icon(Icons.chevron_right_rounded),
              ),
            )
            .toList(),
      ),
    );
  }
}

class AboutView extends StatelessWidget {
  const AboutView({super.key});
  @override
  Widget build(BuildContext context) => const SectionShell(
    title: '딜러 소개',
    subtitle: '정확한 정보와 투명한 상담을 약속드립니다.',
    child: Column(
      children: [
        _AboutRow(label: '이름', value: '김태규'),
        _AboutRow(label: '소속 상사', value: '(주)투제이모터웍스'),
        _AboutRow(label: '종사원 번호', value: '26-003-00097'),
        _AboutRow(label: '상사 허가번호', value: '02-1123-000075'),
        _AboutRow(label: '사업자 번호', value: '462-86-03494'),
        _AboutRow(label: '연락처', value: '02-2059-5211'),
        _AboutRow(label: '주소', value: '서울 서초구 양재대로11길 36, 은관 421호'),
      ],
    ),
  );
}

class _AboutRow extends StatelessWidget {
  const _AboutRow({required this.label, required this.value});
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 11),
    child: Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 95,
          child: Text(label, style: const TextStyle(color: Color(0xFF76797E))),
        ),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.right,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
      ],
    ),
  );
}

class SectionShell extends StatelessWidget {
  const SectionShell({
    required this.title,
    required this.subtitle,
    required this.child,
    super.key,
  });
  final String title;
  final String subtitle;
  final Widget child;
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 22, 20, 40),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w900),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: const TextStyle(fontSize: 13, color: Color(0xFF74777C)),
        ),
        const SizedBox(height: 18),
        child,
      ],
    ),
  );
}
