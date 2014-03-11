beforeEach(function() {
  window.counter = 0;
  window.counterFoo = 0;

  window.callBack = function(e) {
    if(e.namespace) return;
    console.log('called with no namespace ' + (++window.counter));
  };

  window.callBackWithData = function(e) {
    console.log('called with custom data: ' + e.data.custom);
  };

  window.callBackWithNs = function(e) {
    if(e.namespace !== 'foo') return;
    console.log('called with ' + e.namespace + ' namespace: ' + (++window.counterFoo));
  };

  window.changeCallBackWithNs = function(e) {
    if(e.namespace !== 'foo') return;
    console.log('called with ' + e.namespace + ' namespace: ' + (++window.counterFoo));
  };

});

afterEach(function() {
  var tt = document.querySelector('#testTarget');
  tt.innerHTML = '';

  // make sure to clean up bound events
  $(tt).off('*');
});

describe('cash event binding', function() {

  beforeEach(function() {
    document.querySelector('#testTarget').innerHTML =
      '<div id="baz"><ul><li id="li1"></li><li id="li2"></li></ul></div><div id="qux"><ul><li></li><li class="me"></li></ul></div>';
  });

  it('records the bound event in the cache', function() {
    $(document.querySelector('#testTarget')).on('click', window.callBack);
    expect($.cache.events[$.q[0].cid]).toBeTruthy();
    $(document.querySelector('#testTarget')).off('click');
  });

  it('can be bound and unbound, no sel or data', function() {
    var spy = spyOn(window, 'callBack').andCallThrough();
    expect(spy.callCount).toBe(0);
    $(document.querySelector('#testTarget')).on('click', window.callBack).trigger('click');
    expect(spy.callCount).toBe(1);
    $(document.querySelector('#testTarget')).off('click').trigger('click');
    expect(spy.callCount).toBe(1);
  });

  it('can be bound and unbound, delegated via sel', function() {
    var spy = spyOn(window, 'callBack').andCallThrough();
    expect(spy.callCount).toBe(0);
    $(document.querySelector('#testTarget')).on('click', window.callBack, 'li.me');
    $(document.querySelector('#testTarget')).find('ul').trigger('click');
    expect(spy.callCount).toBe(0);
    $(document.querySelector('#testTarget')).find('li').trigger('click');
    expect(spy.callCount).toBe(1);
    $(document.querySelector('#testTarget')).find('li.me').trigger('click');
    expect(spy.callCount).toBe(2);
    $(document.querySelector('#testTarget')).off('click').find('li.me').trigger('click');
    expect(spy.callCount).toBe(2);
  });

  it('passes custom data with the event', function() {
    var spy = spyOn(window, 'callBackWithData').andCallThrough();
    $(document.querySelector('#testTarget')).on('click', window.callBackWithData, null,
      {custom: 'soCustom'}).trigger('click').off('click');
    expect(spy).toHaveBeenCalled();
    $(document.querySelector('#testTarget')).on('click', window.callBackWithData, 'div:last-child',
      {custom: 'soSoCustom'}).find('div:last-child').trigger('click');
    $(document.querySelector('#testTarget')).off('click');
    expect(spy).toHaveBeenCalled();
  });

  it('binds, unbinds and honors namespaced events', function() {
    var spy1 = spyOn(window, 'callBack').andCallThrough();
    var spy2 = spyOn(window, 'callBackWithNs').andCallThrough();
    var tt = document.querySelector('#testTarget');
    // both will trigger on click as we do not override the native event object
    $(tt).on('click', window.callBack).on('click.foo', window.callBackWithNs).trigger('click');
    expect(spy1.callCount).toBe(1);
    expect(spy2.callCount).toBe(1);
    // it will have been called but the listener would not have recieved the ns
    expect(window.counter).toBe(1);
    expect(window.counterFoo).toBe(1);
    $(tt).off('click.foo').trigger('click');
    expect(spy1.callCount).toBe(2);
    // it will have been called but the listener would not have recieved the ns
    expect(window.counter).toBe(2);
    expect(window.counterFoo).toBe(1);
  });

  it('can unbind all events in a namespace', function() {
    var spy1 = spyOn(window, 'callBack').andCallThrough();
    var spy2 = spyOn(window, 'callBackWithNs').andCallThrough();
    var spy3 = spyOn(window, 'changeCallBackWithNs').andCallThrough();
    var tt = document.querySelector('#testTarget');

    $(tt).on('click', window.callBack).
          on('click.foo', window.callBackWithNs).
          on('change.foo', window.changeCallBackWithNs).
          trigger('click');

    // no change has happened. generic clicks have occurred.
    expect(spy1.callCount).toBe(1);
    expect(spy2.callCount).toBe(1);
    expect(spy3.callCount).toBe(0);

    // the click event invokes all click callbacks
    expect(window.counter).toBe(1);
    expect(window.counterFoo).toBe(1);

    // now trigger a change
    $(tt).trigger('change');

    // clicks should not have been invoked
    expect(spy1.callCount).toBe(1);
    expect(spy2.callCount).toBe(1);
    expect(spy3.callCount).toBe(1);

    // change.foo is the only callback. foo should have been incremented.
    expect(window.counter).toBe(1);
    expect(window.counterFoo).toBe(2);

    // remove all foo events and trigger a click and a change
    $(tt).off('*.foo').trigger('change').trigger('click');

    // the standard click event should be fired
    expect(spy1.callCount).toBe(2);
    // the foo callbacks should not get called
    expect(spy2.callCount).toBe(1);
    expect(spy3.callCount).toBe(1);

    // and our counters should reflect the above statements.
    expect(window.counter).toBe(2);
    expect(window.counterFoo).toBe(2);
  });

  // this came from a bug where when a selector matched two elements
  // and when triggered consecutively, the second element's callback
  // would get called but with a reference to the other element's delegateTarget.
  it('does not keep references to previous callbacks', function() {
    var tt = document.querySelector('#testTarget'),
    target,
    fa = function(e){ target = e.delegateTarget; },
    fb = function(e){ target = e.delegateTarget; },
    li1 = document.getElementById('li1'),
    li2 = document.getElementById('li2');

    $(tt).on('click', fa, '#baz li').on('click', fb, '#baz li');

    $(li1).trigger('click');
    expect(target.id).toEqual(li1.id);
    $(li2).trigger('click');
    expect(target.id).toEqual(li2.id);

  });

});
