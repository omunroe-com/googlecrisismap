// Copyright 2012 Google Inc.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License"); you may not
// use this file except in compliance with the License.  You may obtain a copy
// of the License at: http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software distrib-
// uted under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
// OR CONDITIONS OF ANY KIND, either express or implied.  See the License for
// specific language governing permissions and limitations under the License.

// Author: kpy@google.com (Ka-Ping Yee)

goog.require('cm.css');

function EditPresenterTest() {
  cm.TestBase.call(this);
  this.config_ = {
    legend_url: '/root/.legend',
    api_maps_url: '/root/.api/maps',
    save_url: '/root/.api/maps/m1?xsrf=abc'
  };
}
EditPresenterTest.prototype = new cm.TestBase();
registerTestSuite(EditPresenterTest);

/** Tests that the EditPresenter responds correctly to IMPORT events. */
EditPresenterTest.prototype.testImportEvent = function() {
  var model = new cm.MapModel();
  var importer = this.expectNew_('cm.ImporterView', '/root/.api/maps');
  var presenter = new cm.EditPresenter(null, model, null, this.config_);
  expectCall(importer.openImporter)();
  cm.events.emit(cm.app, cm.events.IMPORT, {});
};

/** Tests that the EditPresenter responds correctly to INSPECT events. */
EditPresenterTest.prototype.testInspectEvent = function() {
  var model = new cm.MapModel();
  var inspector = this.expectNew_('cm.InspectorPopup');
  var presenter = new cm.EditPresenter(null, model, null, this.config_);

  // Emitting an INSPECT event on a map should open an inspector on the map.
  expectCall(inspector.inspect)('Edit map details', allOf([
    contains({key: 'title', label: 'Title', type: cm.editors.Type.TEXT}),
    contains({key: 'description', label: 'Description',
              type: cm.editors.Type.HTML,
              preview_class: cm.css.MAP_DESCRIPTION}),
    contains({key: 'viewport', label: 'Default viewport',
              type: cm.editors.Type.LAT_LON_BOX, app_state: null})
  ]), null, model, false);
  cm.events.emit(cm.app, cm.events.INSPECT, {object: model});

  // Emitting an INSPECT event on a layer should open an inspector on the layer.
  var layer = new cm.LayerModel();
  var layerSpecExpect = allOf([
    contains({key: 'title', label: 'Title', type: cm.editors.Type.TEXT,
              tooltip: cm.MSG_LAYER_TITLE_TOOLTIP}),
    contains({key: 'description', label: 'Description',
              type: cm.editors.Type.HTML,
              preview_class: cm.css.LAYER_DESCRIPTION,
              tooltip: cm.MSG_LAYER_DESCRIPTION_TOOLTIP}),
    contains({key: 'legend', label: 'Legend', type: cm.editors.Type.LEGEND,
              preview_class: cm.css.LAYER_LEGEND, legend_url: '/root/.legend',
              tooltip: cm.MSG_LEGEND_TOOLTIP}),
    contains({key: 'viewport', label: '"Zoom to area" viewport',
              type: cm.editors.Type.LAT_LON_BOX, app_state: null,
              tooltip: cm.MSG_LAYER_VIEWPORT_TOOLTIP}),
    contains({key: 'min_zoom', label: 'Minimum zoom level',
              type: cm.editors.Type.NUMBER, minimum: 0, maximum: 20,
              require_integer: true, tooltip: cm.MSG_MINIMUM_ZOOM_TOOLTIP}),
    contains({key: 'max_zoom', label: 'Maximum zoom level',
              type: cm.editors.Type.NUMBER, minimum: 0, maximum: 20,
              require_integer: true, tooltip: cm.MSG_MAXIMUM_ZOOM_TOOLTIP})
  ]);
  expectCall(inspector.inspect)(cm.MSG_EDIT_LAYER_DETAILS, layerSpecExpect,
                                null, layer, false);
  cm.events.emit(cm.app, cm.events.INSPECT, {object: layer});

  // Emitting an INSPECT event with no object should open an inspector on a new
  // layer.
  expectCall(inspector.inspect)(cm.MSG_CREATE_NEW_LAYER, layerSpecExpect, null,
                                null, true);
  cm.events.emit(cm.app, cm.events.INSPECT, {});

  // Emitting an INSPECT event on a topic should open an inspector on the map.
  var topic = new cm.TopicModel();
  var topicSpecExpect = allOf([
    contains({key: 'title', label: cm.MSG_TITLE, type: cm.editors.Type.TEXT,
              tooltip: cm.MSG_TOPIC_TITLE_TOOLTIP}),
    contains({key: 'viewport', label: cm.MSG_DEFAULT_VIEWPORT,
              type: cm.editors.Type.LAT_LON_BOX, app_state: null,
              hide_tile_layer_warning: true,
              tooltip: cm.MSG_TOPIC_VIEWPORT_TOOLTIP}),
    contains({key: 'tags', label: cm.MSG_TAGS, type: cm.editors.Type.TEXT_LIST,
              tooltip: cm.MSG_TOPIC_TAGS_TOOLTIP})
  ]);
  expectCall(inspector.inspect)(cm.MSG_EDIT_TOPIC, topicSpecExpect, null,
                                topic, false);
  cm.events.emit(cm.app, cm.events.INSPECT, {object: topic});

  // Emitting an INSPECT event with no object and isNewTopic true should open
  // an inspector on a new topic.
  expectCall(inspector.inspect)(cm.MSG_CREATE_NEW_TOPIC, topicSpecExpect, null,
                                null, false);
  cm.events.emit(cm.app, cm.events.INSPECT, {isNewTopic: true});
};

function findEditorSpec(key, editorSpecs) {
  for (var i = 0; i < editorSpecs.length; i++) {
    if (editorSpecs[i].key === key) {
      return editorSpecs[i];
    }
  }
}

/** Tests that 'enable_osm_map_type_editing' enables the OSM base map option. */
EditPresenterTest.prototype.testEnableOsmMapTypeEditing = function() {
  var OSM_CHOICE = {value: 'OSM', label: 'OpenStreetMap'};
  var model = new cm.MapModel();
  var inspector = this.expectNew_('cm.InspectorPopup'), specs;
  inspector.inspect = function(title, editorSpecs, object) {
    specs = editorSpecs;
  };

  // This should call inspector.inspect, which captures the 'editorSpecs' arg.
  var presenter = new cm.EditPresenter(null, null, null, {});
  cm.events.emit(cm.app, cm.events.INSPECT, {object: model});
  // The OSM option should not be present.
  var spec = findEditorSpec('map_type', specs);
  expectThat(spec.choices, not(contains(OSM_CHOICE)));

  // Try again, this time with the enable_osm_map_type_editing flag set.
  presenter = new cm.EditPresenter(null, null, null,
                                   {enable_osm_map_type_editing: true});
  cm.events.emit(cm.app, cm.events.INSPECT, {object: model});
  // The OSM option should be present this time.
  var spec = findEditorSpec('map_type', specs);
  expectThat(spec.choices, contains(OSM_CHOICE));
};


/** Tests that the EditPresenter responds correctly to ARRANGE events. */
EditPresenterTest.prototype.testArrangerEvent = function() {
  var arranger = this.expectNew_('cm.ArrangeView',
      new FakeElement('div'), null, null, new cm.MapModel());
  var presenter = new cm.EditPresenter(null, null, arranger);

  // Emitting an ARRANGE event should open the layer arranger.
  expectCall(arranger.isOpen)();
  expectCall(arranger.open)();
  cm.events.emit(cm.app, cm.events.ARRANGE, {});
};

/** Tests that the EditPresenter responds to ADD_LAYERS events. */
EditPresenterTest.prototype.testAddLayersEvent = function() {
  var presenter = new cm.EditPresenter(null, null, null);

  // Emitting a ADD_LAYERS event should create and execute a
  // CreateLayersCommand.
  var layers = [{title: 'Empty Layer'}];
  var createLayersCommand = this.expectNew_('cm.CreateLayersCommand', layers);
  expectCall(createLayersCommand.execute)(_, _);
  cm.events.emit(cm.app, cm.events.ADD_LAYERS, {layers: layers});
};

/**
 * Tests that the EditPresenter responds to NEW_LAYER events
 */
EditPresenterTest.prototype.testNewLayerEvent = function() {
  var presenter = new cm.EditPresenter(null, null, null);

  // Emitting a NEW_LAYER event should create and execute a
  // CreateLayersCommand.
  var properties = {title: 'Empty Layer'};
  var createLayersCommand = this.expectNew_('cm.CreateLayersCommand',
      new gjstest.Matcher(
          'has one maproot with title ' + properties['title'],
          'doesn\'t have one maproot with title ' + properties['title'],
          function(maproots) {
            return (maproots.length = 1 &&
                maproots[0]['title'] === properties['title']);
          }));
  expectCall(createLayersCommand.execute)(_, _);
  cm.events.emit(cm.app, cm.events.NEW_LAYER, {properties: properties});
};

/** Tests that the EditPresenter responds to DELETE_LAYER events. */
EditPresenterTest.prototype.testLayerDeletedEvent = function() {
  var presenter = new cm.EditPresenter(null, null, null);

  // Emitting a DELETE_LAYER event should create and execute an
  // DeleteLayerCommand.
  var id = 'new_layer_id';
  var deleteLayerCommand = this.expectNew_('cm.DeleteLayerCommand', id);
  expectCall(deleteLayerCommand.execute)(_, _);
  cm.events.emit(cm.app, cm.events.DELETE_LAYER, {id: id});
};

/**
 * Tests that the EditPresenter responds to NEW_TOPIC events
 */
EditPresenterTest.prototype.testNewTopicEvent = function() {
  var mapModel = cm.MapModel.newFromMapRoot({'id': 'map1', 'layers': []});
  var presenter = new cm.EditPresenter(null, mapModel, null);

  // Emitting a CREATE_TOPIC event should create and execute a
  // CreateTopicsCommand.
  var properties = {title: 'Boring Topic'};
  var createTopicCommand = this.expectNew_('cm.CreateTopicsCommand',
      new gjstest.Matcher(
          'has one maproot with title ' + properties['title'],
          'doesn\'t have one maproot with title ' + properties['title'],
          function(maproots) {
            return (maproots.length = 1 &&
                maproots[0]['title'] === properties['title']);
          }));
  expectCall(createTopicCommand.execute)(_, _);
  cm.events.emit(cm.app, cm.events.NEW_TOPIC, {properties: properties});
};

/** Tests that the EditPresenter responds to DELETE_TOPIC events. */
EditPresenterTest.prototype.testTopicDeletedEvent = function() {
  var presenter = new cm.EditPresenter(null, null, null);

  // Emitting a DELETE_TOPIC event should create and execute an
  // DeleteTopicCommand.
  var id = 'new_topic_id';
  var deleteTopicCommand = this.expectNew_('cm.DeleteTopicCommand', id);
  expectCall(deleteTopicCommand.execute)(_, _);
  cm.events.emit(cm.app, cm.events.DELETE_TOPIC, {id: id});
};

/** Tests that the EditPresenter responds to EDIT_TOPICS events. */
EditPresenterTest.prototype.testEditTopicsEvent = function() {
  var topicSelector = this.expectNew_('cm.TopicSelectorView', _);
  expectCall(topicSelector.isOpen)().willOnce(returnWith(true));
  var presenter = new cm.EditPresenter(null, null, null);
  cm.events.emit(cm.app, cm.events.EDIT_TOPICS, {});
};

/** Tests that the EditPresenter responds correctly to OBJECT_EDITED events. */
EditPresenterTest.prototype.testObjectEditedEvent = function() {
  var inspector = this.expectNew_('cm.InspectorPopup');
  var presenter = new cm.EditPresenter(null, null, null);

  // Emitting an OBJECT_EDITED event should create and execute an EditCommand.
  var a = {x: 5}, b = {x: 6};
  var editCommand = this.expectNew_('cm.EditCommand', a, b, null, undefined);
  expectCall(editCommand.execute)(_, _);
  cm.events.emit(cm.app, cm.events.OBJECT_EDITED, {
    oldValues: a, newValues: b, layerId: null
  });
};

/** Tests that the EditPresenter responds to LAYERS_ARRANGED events. */
EditPresenterTest.prototype.testLayersArrangedEvent = function() {
  var presenter = new cm.EditPresenter(null, null, null);

  // Emitting a LAYERS_ARRANGED event should create and execute an
  // ArrangeCommand.
  var oldVal = new google.maps.MVCArray(['a', 'b', 'c']);
  var newVal = new google.maps.MVCArray(['c', 'b', 'a']);
  var arrangeCommand = this.expectNew_('cm.ArrangeCommand',
                                       oldVal, newVal);
  expectCall(arrangeCommand.execute)(_, _);
  cm.events.emit(cm.app, cm.events.LAYERS_ARRANGED, {
    oldValue: oldVal, newValue: newVal
  });
};

/** Tests that EditPresenter emits UNDO_REDO_BUFFER_CHANGED events correctly. */
EditPresenterTest.prototype.testCommandBufferChangedEvent = function() {
  var inspector = this.expectNew_('cm.InspectorPopup');
  var presenter = new cm.EditPresenter(null, null, null);
  var undoPossible, redoPossible;

  cm.events.listen(cm.app, cm.events.UNDO_REDO_BUFFER_CHANGED,
    function(e) {
      undoPossible = e.undo_possible;
      redoPossible = e.redo_possible;
    });

  var fakeCommand = {};
  fakeCommand.undo = function(a, b) { return true; };
  fakeCommand.execute = function(a, b) { return true; };

  // After a command is added to the buffer, there is a command to undo but
  // nothing to redo.
  presenter.doCommand(fakeCommand, {}, {});
  expectTrue(undoPossible);
  expectFalse(redoPossible);

  // After an undo operation, there is a command to redo but nothing to undo.
  cm.events.emit(cm.app, cm.events.UNDO);
  expectFalse(undoPossible);
  expectTrue(redoPossible);

  // After a redo operation, there is a command to undo but nothing to redo.
  cm.events.emit(cm.app, cm.events.REDO);
  expectTrue(undoPossible);
  expectFalse(redoPossible);
};

/** Tests that EditPresenter calls share on a SHARE_EMAIL event. */
EditPresenterTest.prototype.testShareEmailView = function() {
  var sharer = this.expectNew_('cm.ShareEmailView');
  var presenter = new cm.EditPresenter(null, null, null,
                                       {'save_url': 'bogus_url'});
  var url = false;
  sharer.share = function(save_url) { url = true; };

  // Emitting a SHARE_EMAIL event should open a share email popup.
  cm.events.emit(cm.app, cm.events.SHARE_EMAIL);
  expectTrue(url);
};

/**
 * Tests that the edit presenter correctly creates a new SetDefaultView command
 * when the DEFAULT_VIEW_SET event is fired.
 */
EditPresenterTest.prototype.testSetDefaultView = function() {
  var oldDefault = new cm.AppState(undefined, undefined, 'fr');
  var newDefault = new cm.AppState(undefined, undefined, 'es');
  var command = this.expectNew_(
      'cm.SetDefaultViewCommand', oldDefault, newDefault);
  expectCall(command.execute)(_, _);

  var presenter = new cm.EditPresenter(null, null, null);
  cm.events.emit(cm.app, cm.events.DEFAULT_VIEW_SET,
      {oldDefault: oldDefault, newDefault: newDefault});
};

/** Tests that the EditPresenter handles a SAVE event by saving the map. */
EditPresenterTest.prototype.testSaveEvent = function() {
  this.setForTest_('cm.xhr.post', createMockFunction());
  expectCall(cm.xhr.post)(this.config_['save_url'], {'json': [1, 2, 3]}, _);

  var presenter = new cm.EditPresenter(null, null, null, this.config_);
  cm.events.emit(cm.app, cm.events.SAVE,
      {model: {toMapRoot: function() { return [1, 2, 3]; }}});
};
