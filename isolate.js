define([],function(){
  "use strict";

  /* helpers pulled from underscore.js.
   * http://documentcloud.github.com/underscore/
   */
  var _ = {
    each: function(list,func){
      for(var i in list){
        func(list[i],i);
      }
    },
    extend: function(obj) {
      _.each(Array.prototype.slice.call(arguments, 0), function(source) {
        for (var prop in source) {
          if (source[prop] !== void 0) obj[prop] = source[prop];
        }
      });
      return obj;
    },
    isObject: function(obj){
      return obj === Object(obj);
    },
    isFunction: function(obj){
      return !!(obj && obj.constructor && obj.call && obj.apply);
    },
    isArray: function(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    }
  }
  /* end underscore.js helpers */

  // mainCtx is the requirejs context which we should work against
  var mainCtx = require.s.contexts["_"];

  // mockModule consumes a module name, actual module implementation,
  // and an isolationContext configuration and returns the proper
  // implementation for the context.
  var mockModule = function(moduleName, orig, config){
    if(moduleName in config.dependenciesToPassthru) return orig;
    var mappedInstance;
    if(moduleName in config.mappedInstances) {
      return instanceOrFactory(config.mappedInstances[moduleName], orig, config);
    }
    else {
      for(var regex in config.mappedInstances){
        if( moduleName.match(new RegExp(regex))){
          return instanceOrFactory(config.mappedInstances[regex], orig, config);
        }
      }
    }
    // if we're mocking all modules, then return a mock object otherwise return
    // the original module
    return config.mockAll ? mockThis(orig,config) : orig;
  }

  // For a given match when looking through the mapping context configuration
  // extract the intended instance to inject
  var instanceOrFactory = function(match, orig, config){
    if(match instanceof IsolationFactory){
      return match.getInstance(orig, config)
    }
    return match;
  }

  // mockThis consumes an implementation and an IsolationContext configuration
  // and returns the proper implementation for the context. Used recursively where needed.
  var mockThis = function(orig,config){
    var mock;
    if( _.isFunction(orig)){
      mock = config.typeHandlers["function"](orig,config);
    } else if( _.isObject(orig) ){
      mock = config.typeHandlers["object"](orig,config);
    } else if( _.isArray(orig) ){
      mock = [];
      _.each(orig, function(item,i){ mock[i] = mockThis(item,config); });
    }
    return mock;
  }

  var IsolationFactory = function(factory){
    this.getInstance = function(impl){
      return factory(impl);
    }
  }

  var IsolationContext = function(baseConfig){
    var config = {
      mockAll: false,
      dependenciesToPassthru: {},
      mappedInstances: {},
      typeHandlers: {},
      dependenciesKey: "dependencies"
    };

    // copy over configuration entries from the baseConfig object
    _.each(baseConfig.dependenciesToPassthru, function(x,modName){ config.dependenciesToPassthru[modName] = 1 });
    _.each(baseConfig.mappedInstances, function(impl,mod){ config.mappedInstances[mod] = impl });
    _.each(baseConfig.typeHandlers, function(handler,type){ config.typeHandlers[type] = handler });

    // public API for configuring the IsolationContext
    var contextConfigurator = {

      // mark provided modules (params array) as modules to skip mocking and passthru to the real implementations
      passthru: function(){
        var modules = Array.prototype.splice.call(arguments,0);
        _.each(modules,function(module){ config.dependenciesToPassthru[module] = 1; });
        return contextConfigurator;
      },

      // map a specific module name to a specific implementation
      map: function(moduleName, impl){
        if("object" === typeof(moduleName)){
          _.each(moduleName, function(impl, moduleName){
            contextConfigurator.map(moduleName, impl);
          })
        } else {
          config.mappedInstances[moduleName] = impl;
        }
        return contextConfigurator;
      },

      // map a certain type to a factory which will provide the mock implementation
      mapType: function(type, factory){
        config.typeHandlers[type.toLowerCase()] = factory;
        return contextConfigurator;
      }
    }

    contextConfigurator.map.asFactory = function(){
      if(typeof(arguments[0]) === "function")
        return new IsolationFactory(arguments[0]);
      if("object" === typeof(arguments[0])){
        _.each(arguments[0], function(factory, moduleName){
          contextConfigurator.map(moduleName, new IsolationFactory(factory));
        })
      } else {
        contextConfigurator.map(arguments[0], new IsolationFactory(arguments[1]));
      }
      return contextConfigurator;
    }

    // load provides the method for both requirejs to use isolate as a plugin
    // and users to invoke isolate directly.
    // to use as a plugin, include isolate!<moduleName> in your module dependencies
    // to use directly, include isolate is your module dependencies and then call isolate.load("<moduleName>",func(m){...});
    this.load = function(name){
      var callingMode = (arguments.length === 4) ? "plugin" : "direct",
          load, req = require;
      if(callingMode == "direct") {
          load = arguments[1];
      } else {
        load = arguments[2];
        req = arguments[1];
      }

      var isolatedContextName = "isolated_" + Math.floor(Math.random() * 10000),
          isolatedRequire = require.config( _.extend({ context: isolatedContextName }, { baseUrl: mainCtx.config.baseUrl } )),
          isolatedCtx = require.s.contexts[isolatedContextName]

      req([name], function(module){

        for(var key in isolatedCtx.defined) { delete isolatedCtx.defined[key]; }
        for(var key in isolatedCtx.loaded) { delete isolatedCtx.loaded[key]; }

        for(var modName in mainCtx.defined){
          if(modName == name) continue;

          isolatedCtx.defined[modName] = mockModule(modName, mainCtx.defined[modName], config);
          isolatedCtx.loaded[modName] = true;
        }
        delete isolatedCtx.defined[name];
        delete isolatedCtx.loaded[name];

        isolatedRequire([name], function(isolatedModule){
          if( config.dependenciesKey ) {
            isolatedModule[config.dependenciesKey] = isolatedCtx.defined;
          }
          load(isolatedModule);
        })

      })
    }

    this.configure = function(func){
      func(contextConfigurator);
      return this;
    }

    this.createContext = function(){
      return new IsolationContext(config);
    }
  }

  var wrapperFunc = function(){
    var injected;
    var simulatedFunction = function(){
      if( injected ) return injected.apply(this,arguments) || this;
    }
    simulatedFunction.doThis = function(func){ injected = func; }
    return simulatedFunction;
  }
  // Initial baseline configuration
  var initialConfig = {
    dependenciesToPassthru: {"isolate": 1},
    mappedInstances:{},
    typeHandlers: {
      "function": function(){ return new wrapperFunc() },
      "object": function() { return {} },
      "string": function() { return "" },
      "number": function() { return 0 }
    }
  }

  return new IsolationContext(initialConfig);
})