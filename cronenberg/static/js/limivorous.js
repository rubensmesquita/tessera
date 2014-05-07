/*!
 * Limivorous - Copyright Adam Alpern 2014
 * https://github.com/aalpern/limivorous
 * MIT license
 */

var limivorous =
  (function() {
    "use strict";

    var self = {}

    self.CHANGE_EVENT = 'change'

    /**
     * Define the core properties and methods to make target an
     * observable data model object.
     *
     * This will define several public methods on the target object.
     *
     * Methods defined:
     *   on(event, observer), to register observers
     *   cancel(event, observer), to remove observers
     *
     * @param {Object} target
     */
    self.observable = function(target, context) {
      var observer_registry = {}

      context.notifyObservers = function(event, data) {
        var observers = observer_registry[event]
        if (observers) {
          for (var i in observers) {
            observers[i](data)
          }
        }
      }

      /**
       * Register a new observer. Observers should be functions
       * accepting a single argument, which is an event context. Event
       * contexts are objects with the following properties:
       *
       *  - target: the modified data model object
       *  - property: the name of the property that was modified
       *  - value: the new value of the property
       *  - previous: the previous value of the property
       *
       * @param event {string} The event to observe. One of either
       *                       'change', for all property updates, or
       *                       'change:propname' for receiving updates
       *                       only to specific properties.
       * @param observer {function} A callback function
       * @param options {object}
       */
      target.on = function(event, observer, options_) {
        var options = options_ || {}
        var observers = observer_registry[event]
        if (observers === undefined) {
          observer_registry[event] = observers = []
        }
        observers.push(observer)
        return target
      }

      /**
       * Remove one or more registered observers.
       *
       * Usage:
       *   cancel() - remove all observers
       *   cancel(event) - remove all observers for a specific event
       *   cancel(event, observer) - remove one specific observer
       *
       * @param event {string} An event specifier.
       * @param observer {function} A specific observer function to remove.
       */
      target.cancel = function(event, observer) {
        if (arguments.length == 0) {
          observer_registry = {}

        } else if (arguments.length == 1) {
          delete observer_registry[event]

        } else if (arguments.length > 1 && observer_registry[event]) {
          var index = observer_registry[event].indexOf(observer)
          if (index > -1) {
            observer_registry[event].splice(index, 1)
          }
        }
        return target
      }

      Object.defineProperty(target, 'observers', {get: function() { return observer_registry }})

      return self
    }

    /**
     * Define an observable property on target.
     *
     * This will define a property on the target object. It will have
     * a simple getter to return the current value, and a setter which
     * can raise events to notify observers of the property's state. A
     * setter method that returns the object will also be generated,
     * to allow assignment in a method chaining style.
     *
     * The target object will also gain a method on() for registering
     * observers.
     *
     * Options:
     *   transform: A function which will transform the new value
     *              before storing it.
     *   update: A function which can be used for updating internal
     *           state before observers are notified.
     *
     * @param {Object} target The object to define the property on.
     * @param {String} name The name of the public property.
     * @param {Object} context The privately scoped backing store for the property value.
     * @param {Object} options An optional object with additional
     *                         options for configuring property
     *                         behavior.
     */
    self.defineProperty = function(target, name, context, options_) {
      var options = options_ || {}

      var setter = function(value) {
        if (options.transform && (options.transform instanceof Function)) {
          value = options.transform(value)
        }
        var event = {
          target: target,
          property: name,
          value: value,
          previous: context[name]
        }
        context[name] = value
        if (options.update && (options.update instanceof Function)) {
          options.update()
        }
        context.notifyObservers(self.CHANGE_EVENT + ':' + name, event)
        context.notifyObservers(self.CHANGE_EVENT, event)
        return target
      }

      Object.defineProperty(target, name, {
        get: function() { return context[name] },
        set: setter,
        enumerable: true
      })
      target['set_' + name] = setter

      return self
    }

    /**
     * An alias for defineProperty.
     */
    self.property = self.defineProperty

    return self
  })();