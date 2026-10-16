(function(){
  'use strict';

  var bestPosts=[
    {bestId:'best-001',sourcePostId:5,rank:1,board:'튜닝',title:'프렁크 소프트 클로징 장착 후기입니다',score:18842},
    {bestId:'best-002',sourcePostId:23,rank:2,board:'전기차',title:'전기차 충전구역 장기 주차 신고 기준',score:17815},
    {bestId:'best-003',sourcePostId:22,rank:3,board:'TSLA',title:'FSD 일시불 구매했다 vs 안했다 투표',score:13201},
    {bestId:'best-004',sourcePostId:1,rank:4,board:'전기차',title:'제네시스 GV90 네오룬 공개',score:12144},
    {bestId:'best-005',sourcePostId:8,rank:5,board:'전기차',title:'아이오닉5N 하루 타보고 느낀 점',score:10862},
    {bestId:'best-006',sourcePostId:14,rank:6,board:'테슬라',title:'오토파일럿 차선 중앙 유지가 흔들립니다',score:9473}
  ];

  window.BOBAE_BEST_POSTS=bestPosts.map(function(post){return Object.freeze(post)});
})();
