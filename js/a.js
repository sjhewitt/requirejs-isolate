define(["b", "c"], function(b,c){

  return {
    whatIsBsName: function(){
      return b.name();
    },
    whatIsCsName: function(){
      return c.name();
    }
  }
})