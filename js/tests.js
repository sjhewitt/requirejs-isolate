define(["isolate", "a", "b"],function(isolate, a, realB){
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

  isolate.createContext().configure(function(cfg){
    cfg.map("b", cfg.map.asFactory(function(impl){return { name: function(){ return "fake"}, impl: impl }; }))
  }).load("a", function(a){
    expect(a.dependencies.b.name(), "fake")
    expect(a.dependencies.b.impl, realB)
  })

  isolate.createContext().configure(function(cfg){
    cfg.map.asFactory("b", function(impl){return { name: function(){ return "fake"}, impl: impl }; })
  }).load("a", function(a){
    expect(a.dependencies.b.name(), "fake")
    expect(a.dependencies.b.impl, realB)
  })

  isolate.createContext().configure(function(cfg){
    cfg.map.asFactory( { "b": function(impl){return { name: function(){ return "fake"}, impl: impl }; } })
  }).load("a", function(a){
    expect(a.dependencies.b.name(), "fake")
    expect(a.dependencies.b.impl, realB)
  })
})