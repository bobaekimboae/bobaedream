/* 게시판별 전용 테이블(data/board-*.js)을 화면에서 쓰는 게시글 모양으로 바꿔 준다.
   전용 테이블이 있는 게시판은 공용 시나리오 글 대신 그 테이블의 글만 보여 준다. */
(function(){
  'use strict';
  var tables=window.BBM_BOARD_TABLES=window.BBM_BOARD_TABLES||{};
  function list(value){return String(value==null?'':value).split('|').map(function(v){return v.trim();}).filter(Boolean);}
  function num(value){var n=Number(String(value==null?'':value).replace(/,/g,''));return isFinite(n)?n:0;}
  function relative(iso){
    var time=Date.parse(iso||'');
    if(!time)return '';
    var diff=Math.max(0,Date.now()-time)/60000;
    if(diff<1)return '방금 전';
    if(diff<60)return Math.floor(diff)+'분 전';
    if(diff<1440)return Math.floor(diff/60)+'시간 전';
    if(diff<10080)return Math.floor(diff/1440)+'일 전';
    var d=new Date(time);
    return String(d.getMonth()+1).padStart(2,'0')+'.'+String(d.getDate()).padStart(2,'0');
  }
  function toPost(row,table){
    var category=String(row.category||'').trim()||table.displayName;
    var images=list(row.images);
    var thumb=String(row.thumbnail||'').trim()||images[0]||'';
    var body=String(row.body||row.summary||'').split(/\n+/).map(function(v){return v.trim();}).filter(Boolean);
    var published=Date.parse(row.publishedAt||'');
    var embeds=list(row.embed).map(function(url){return window.BBM_EMBED?window.BBM_EMBED.info(url):{url:url,render:'preview'};}).filter(Boolean);
    if(embeds.length&&row.embedTitle){
      embeds[0]=Object.assign({},embeds[0],{
        title:String(row.embedTitle||'').trim(),
        description:String(row.embedDescription||'').trim(),
        image:String(row.embedImage||'').trim(),
        logo:String(row.embedLogo||'').trim(),
        site:String(row.embedSite||row.source||'').trim(),
        provider:String(row.embedProvider||'').trim(),
        lang:String(row.embedLang||row.originalLanguage||'').trim(),
        // 자동 수집 게시판은 저장된 메타데이터만 써서 브라우저의 외부 메타 API 요청 폭주를 막는다.
        metaReady:true
      });
    }
    return {
      id:num(row.id),
      board:table.board,
      boardTable:true,
      title:'['+category+'] '+String(row.title||'').trim(),
      user:String(row.author||row.source||table.displayName).trim(),
      category:category,
      time:relative(row.publishedAt),
      view:num(row.views),
      reply:num(row.comments),
      likes:num(row.likes),
      fresh:published?Date.now()-published<86400000:false,
      thumb:thumb,
      thumbnail:thumb,
      detailImage:images[0]||thumb,
      images:images,
      photos:images.length||(thumb?1:0),
      video:false,
      rank:0,
      body:body.length?body:[String(row.summary||'').trim()].filter(Boolean),
      summary:String(row.summary||'').trim(),
      summary3:list(row.summary3).slice(0,3),
      source:String(row.source||'').trim(),
      sourceUrl:String(row.sourceUrl||'').trim(),
      publishedAt:row.publishedAt||'',
      country:String(row.country||'').trim(),
      region:String(row.region||'').trim(),
      originalTitle:String(row.originalTitle||'').trim(),
      originalLanguage:String(row.originalLanguage||'').trim(),
      relatedCount:num(row.relatedCount),
      collectedAt:row.collectedAt||'',
      collector:String(row.collector||'').trim(),
      tags:list(row.tags),
      reviewId:String(row.reviewId||row.id||'').trim(),
      modelId:String(row.modelId||'').trim(),
      brand:String(row.brand||'').trim(),
      model:String(row.model||'').trim(),
      trim:String(row.trim||'').trim(),
      powertrain:String(row.powertrain||'').trim(),
      rating:num(row.rating),
      owner:String(row.owner||'').toLowerCase()==='true',
      ownershipLabel:String(row.ownershipLabel||'').trim(),
      benchmark:String(row.benchmark||'').trim(),
      location:String(row.location||'').trim(),
      ratings:list(row.ratings),
      brandLogo:String(row.brandLogo||'').trim(),
      energyId:String(row.energyId||row.id||'').trim(),
      city:String(row.city||'').trim(),
      odometer:String(row.odometer||'').trim(),
      fuelConsumption:String(row.fuelConsumption||'').trim(),
      energyConsumption:String(row.energyConsumption||'').trim(),
      fullChargeRange:String(row.fullChargeRange||'').trim(),
      verified:String(row.verified||'').toLowerCase()==='true',
      embeds:embeds
    };
  }
  function postsFor(boardId){
    var table=tables[boardId];
    if(!table)return null;
    return (table.rows||[]).filter(function(row){return row&&row.title;}).map(function(row){return toPost(row,table);})
      .sort(function(a,b){return (Date.parse(b.publishedAt)||0)-(Date.parse(a.publishedAt)||0);});
  }
  function boardIdForLabel(label){
    var found='';
    Object.keys(tables).forEach(function(id){if(tables[id].displayName===label)found=id;});
    return found;
  }
  function allPosts(){
    var out=[];
    Object.keys(tables).forEach(function(id){out=out.concat(postsFor(id)||[]);});
    return out;
  }
  window.BBM_BOARD_TABLE={postsFor:postsFor,boardIdForLabel:boardIdForLabel,allPosts:allPosts,has:function(id){return Boolean(tables[id]);}};
})();
