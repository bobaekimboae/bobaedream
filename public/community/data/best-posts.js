(function(){
  'use strict';

  var table=(window.BBM_BOARD_TABLES||{}).best;
  var scores=[18842,17815,13201,12144,10862,9473];
  var rows=table&&Array.isArray(table.rows)?table.rows:[];
  window.BOBAE_BEST_POSTS=rows.map(function(row,index){
    return Object.freeze({
      bestId:'best-'+row.id,
      id:Number(row.id),
      rank:index+1,
      board:row.category,
      title:row.title,
      score:scores[index]||0
    });
  });
})();
