define(["b", "c", "d"], function(b,c,d){

  return {
    whatIsBsName: function(){
      return b.name();
    },
    whatIsCsName: function(){
      return c.name();
    },
    whatIsDsName: function(){
      return d.name();
    }
  }
})