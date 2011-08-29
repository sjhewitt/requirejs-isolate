require-isolate
===============

require-isolate is a plugin to [requirejs](http://requirejs.org/) that helps simplify testing modules you have defined
by providing a configurable isolation layer around your modules. The isolation layer can be configured to behave as an
automocking container.

Usage: as a require.js plugin
-----

```javascript
define(["isolate!myModule", anotherModule], function(myModule, anotherModule){
  // ...
});
```

**myModule** will be an isolated instance of your module. Any dependencies it required have been replaced by stubs.

**anotherModule** will be a normal, non-isolated instance of your module. If _anotherModule_ itself depends on _myModule_,
it will get a normal, non-isolated instance of _myModule_ as it's dependency.

Usage: as a direct api
-----

 ```javascript
 define(["isolate"], function(isolate){
   isolate.load("myModule", function(myModule){
     // ...
   });
 });
 ```

 A manual call to _isolate.load_ has the same effect on the target module instance as using isolate as a require.js plugin.

Creating new IsolationContexts
-----

New contexts can be spawned and separately configured using the _.createContext()_ method.

```javascript
 define(["isolate"], function(isolate){
   isolate.createContext()
    //...
 });
```

Context Configuration: runtime configuration
-----

 Using the direct api, you can configure your isolation context.

 ```javascript
 define(["isolate"], function(isolate){
   isolate.configure( function(ctx){
      // configuration here
   }).load("myModule", function(myModule){
     // ...
   });
 });
 ```

 **Very Important!** Note here _.configure_ does not return a IsolatedContext instance. Calls to _.configure_ modify the
 configuration of the context on which it is called. To spawn a new IsolationContext for configuration, use
 _.createContext().configure_ instead.

Chaining Methods
-----

_.configure(...)_ and _.createContext()_ return the IsolationContext instance, so they can be chained together for easier
reading.

```javascript
define(["isolate"], function(isolate){
 isolate
   .createContext()
   .configure( function(ctx){
      /* configuration here */ })
   .load("myModule", function(myModule){
     /* ... */ });
});
```


Context Configration: API
-----

Within either configuration option mentioned above, these method are available to you for configuring the context:

**passthru()**

passthru takes a params array of module names for which it should simply provide the real implementations for when
requested as a dependency.

```javascript
isolate.configure( function(ctx){
  ctx.passthru("myFirstModule", "mySecondModule");
});
```

This setting cascades to any further spawned contexts.

**map(moduleName, implementation)**

map specifies that the given implementation should be provided for any dependencies of moduleName.

```javascript
var wasCalled = false;
isolate.configure( function(ctx){
  ctx.map("myFirstModule", function(){ wasCalled = true; });
});
```

**mapType(typeName, factory)**

mapType configures isolate to consult the provided factory method when encountering an implementation of type _typeName_
to mimic. The types currently supported are _function_ and _object_.

The factory method is passed two parameters: the real module implementation and the current IsolationContext configuration.
This second parameter makes it possible to consult factories for other types from within your provided factory implementation.

```javascript
isolate.configure( function(ctx){
  ctx.mapType("function", function(original, contextConfiguration){ return some_cool_transformation_of(original); });
});
```

Also, each of these configuration methods returns the configuration api object, so they can be chained for easy reading
and less typing:

```javascript
isolate.configure( function(ctx){
  ctx.passthru("one","two","three")
     .mapType("object", function(){ return {} })
     .map("a", { })
     .map("b", { });
});
```