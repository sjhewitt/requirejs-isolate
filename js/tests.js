define(["isolate", "a"],function(isolate, a){
  expect(a.whatIsBsName(), "real B");
  expect(a.whatIsCsName(), "real C");
  
  require(["isolate!a"], function(a){
    expect(a.whatIsBsName(), "global map");
    expect(a.whatIsCsName(), "real C");

    isolate.createContext().configure(function(cfg){
      cfg.map("b", { name: function(){ return "inner manual"; } })
         .mapType("function", function(orig,config){ return function(){ return "fake function" } });
    }).load("a", function(a){
      expect(a.whatIsBsName(), "inner manual");
      expect(a.whatIsCsName(), "real C");
    })

  })
  
  isolate.createContext().configure(function(cfg){
    cfg.map("b", { name: function(){ return "outer manual"; } });
  }).load("a", function(a){
      expect(a.whatIsBsName(), "outer manual");
      expect(a.whatIsCsName(), "real C");
  })

  isolate.createContext().configure(function(cfg){
    cfg.map("b", { name: function(){ return "another manual isolation"; } });
  }).load("a", function(a){
      expect(a.whatIsBsName(), "another manual isolation");
      expect(a.whatIsCsName(), "real C");
  })
  
})