
var ui_label = (function() {
    
    var ui_label_base = (function(_super) {
        
        __extends(ui_label_base, _super);
        function ui_label_base(text, pos) {
            this._standardPadding = 0;
            _super.call(this, 0, 0, 0, 0);
            this.opacity = 0;
            this.set_anchor([0, 0]);
            this.set_text(text);
            this._set_pos([0, 0]);
        }
        
        ui_label_base.prototype.standardPadding = function() {
            return this._standardPadding;
        };
        
        ui_label_base.prototype.set_anchor = function(anchor) {
            if(anchor) {
                this._anchor = anchor;
            }
        };
        
        ui_label_base.prototype.label_text = function() {
            if(!this._label_text) {
                return '';
            } else if(this._label_text instanceof Function) {
                return this._label_text();
            } else {
                return this._label_text;
            }
        };
        
        ui_label_base.prototype.set_text = function(text) {
            if(!text) return;
            this._label_text = text;
            text = this.label_text();
            var padding = this.standardPadding() * 2;
            this.width = this.textWidth(text.split('\n')[0]) + padding;
            this.height = this.calcTextHeight({text: text}, true) + padding;
            this._set_pos();
            this.createContents();
        };
        
        ui_label_base.prototype._set_pos = function(pos) {
            if(pos) {
                this._rawx = (pos[0] || 0);
                this._rawy = (pos[1] || 0);
            }
            this.x = this._rawx - this.width * this._anchor[0];
            this.y = this._rawy - this.height * this._anchor[1];
        };
        
        ui_label_base.prototype.set_pos = function(pos) {
            return this._set_pos(pos);
        };
        
        ui_label_base.prototype.update = function() {
            __supermethod(_super, this, 'update')();
            this.refresh();
        };
        
        ui_label_base.prototype.refresh = function() {
            this.drawTextEx(this.label_text(), 0, 0);
        };
        
        ui_label_base.prototype.bind_to = function(parent) {
            if(!parent) return;
            this.remove();
            parent.addChild(this);
        };
        
        var cscene = () => (sc => (sc instanceof Scene_Map) ? sc : null)(SceneManager._scene);
        ui_label_base.prototype.bind = function() {
            var sc = cscene();
            if(sc) {
                this.remove();
                sc.addWindow(this);
            }
        };
        
        ui_label_base.prototype.remove = function() {
            return this.parent && this.parent.removeChild(this);
        };
        
        return ui_label_base;
        
    })(Window_Base);
    
    var g_map = () => $gameMap;
    
    var ui_label_map = (function(_super) {
        
        __extends(ui_label_map, _super);
        function ui_label_map(...args) {
            _super.call(this, ...args);
            this.set_anchors([0.5, 1.1], [0.5, 0]);
            this.set_pos([0, 0]);
        }
        
        ui_label_map.prototype.set_anchors = function(s_anchor, d_anchor) {
            this.set_anchor(s_anchor);
            if(d_anchor) {
                this._d_anchor = d_anchor;
            }
        };
        
        ui_label_map.prototype.screen_pos = function(pos) {
            return [
                (g_map().adjustX(pos[0]) + this._d_anchor[0]) * g_map().tileWidth(),
                (g_map().adjustY(pos[1]) + this._d_anchor[1]) * g_map().tileHeight(),
            ];
        };
        
        ui_label_map.prototype._set_map_pos_nofresh = function(pos) {
            if(pos) {
                this._map_pos = pos;
            }
        };
        
        ui_label_map.prototype.set_pos = function(pos) {
            this._set_map_pos_nofresh(pos);
            this._set_pos(this.screen_pos(this._map_pos));
        };
        
        ui_label_map.prototype.refresh = function() {
            this.set_pos();
            __supermethod(_super, this, 'refresh')();
        };
        
        return ui_label_map;
        
    })(ui_label_base);

    var ui_label_ev = (function(_super) {
        
        __extends(ui_label_ev, _super);
        function ui_label_ev(...args) {
            _super.call(this, ...args);
        }
        
        var g_ev = evid => evid ? g_map().event(evid) : $gamePlayer;
        
        ui_label_ev.prototype.bind = function(evid) {
            this._bind_evid = (evid || 0);
            __supermethod(_super, this, 'bind')();
        };
        
        ui_label_ev.prototype.refresh = function() {
            var ev = g_ev(this._bind_evid);
            if(!ev) return;
            this._set_map_pos_nofresh([ev._realX, ev._realY]);
            __supermethod(_super, this, 'refresh')();
        };
        
        return ui_label_ev;
        
    })(ui_label_map);

    var label_rebinder = (function() {
        
        function label_rebinder(dyn_evs) {
            this._store = new store_pool('ui_label');
            this._dyn_evs = dyn_evs;
            this._labels_pool = {};
            this._store.load.on(this.rebind.bind(this));
        }
        
        label_rebinder.prototype._new_ev = function(evid, force = false) {
            var epool = this._dyn_evs.epool(evid);
            if(!epool || (!force && !epool['@ui_label'])) return;
            var lb = new ui_label_ev(() => epool['@ui_label']);
            lb.bind(evid);
            this._labels_pool['ev_' + evid] = lb;
            return epool;
        };
        
        label_rebinder.prototype._rebind_ev = function() {
            for(var evid = 1; evid < g_map()._events.length; evid ++) {
                this._new_ev(evid);
            }
        };
        
        label_rebinder.prototype._new_ui = function(linfo, key) {
            var lb;
            if(linfo.type == 'map') {
                lb = new ui_label_map(() => linfo.text);
            } else {
                lb = new ui_label_base(() => linfo.text);
            }
            lb.set_pos(linfo.pos);
            lb.bind();
            this._labels_pool[key] = lb;
        };
        
        label_rebinder.prototype._new_pl = function(linfo, key) {
            var lb = new ui_label_ev(() => linfo.text);
            lb.bind(0);
            this._labels_pool[key] = lb;
        };
        
        label_rebinder.prototype._rebind_ui = function(mid) {
            var labels_info = this._store.get(mid, 'labels_info');
            for(var lkey in labels_info) {
                var linfo = labels_info[lkey];
                if(linfo.type == 'player') {
                    this._new_pl(linfo, lkey);
                } else {
                    this._new_ui(linfo, lkey);
                }
            }
        };
        
        label_rebinder.prototype.rebind = function(mid) {
            this._rebind_ev();
            this._rebind_ui(mid);
        };
        
        label_rebinder.prototype.label = function(key, text, type, ...args) {
            var linfo = {
                text: text,
                type: type,
            };
            if(type == 'event') {
                var evid = key;
                var epool = this._new_ev(evid, true);
                if(!epool) return null;
                epool['@ui_label'] = text;
                return;
            }
            var mid = this._store.mapid();
            if(this._store.get(mid, 'labels_info', key)) return null;
            if(type == 'player') {
                this._new_pl(linfo, key);
            } else {
                linfo.pos = args[0];
                this._new_ui(linfo, key);
            }
            this._store.set(mid, 'labels_info', key, linfo);
        };
        
        label_rebinder.prototype.remove = function(key) {
            if(this._labels_pool[key]) {
                this._labels_pool[key].remove();
                delete this._labels_pool[key];
            }
            var labels_info = this._store.get(this._store.mapid(), 'labels_info');
            if(labels_info[key]) {
                delete labels_info[key];
            }
        };
        
        return label_rebinder;
        
    })();
    
    return label_rebinder;
    
})();

var g_ui_label = new ui_label(g_d_ev);
