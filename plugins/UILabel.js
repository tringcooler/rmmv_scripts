
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
                var otext = this._last_label_text;
                var text = this._label_text();
                this._last_label_text = text;
                if(otext && otext != text) {
                    this._fit_text(text);
                }
                return text;
            } else {
                return this._label_text;
            }
        };
        
        ui_label_base.prototype._fit_text = function(text) {
            var padding = this.standardPadding() * 2;
            this.width = this.textWidth(text.split('\n')[0]) + padding;
            this.height = this.calcTextHeight({text: text}, true) + padding;
            this._set_pos();
            this.createContents();
        };
        
        ui_label_base.prototype.set_text = function(text) {
            if(!text) return;
            this._last_label_text = null;
            this._label_text = text;
            text = this.label_text();
            this._fit_text(text);
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
            this._store.load2.on(this.rebind.bind(this));
        }
        
        label_rebinder.prototype._set_lpool = function(key, lb) {
            if(this._labels_pool[key]) {
                this._labels_pool[key].remove();
            }
            this._labels_pool[key] = lb;
        };
        
        var label_setting = function(lb, setting) {
            if(!setting) return;
            for(var k in setting) {
                var fname = 'set_' + k;
                if(!lb[fname]) {
                    fname = k;
                    if(!lb[fname]) continue;
                }
                if(lb[fname] instanceof Function) {
                    lb[fname](...setting[k]);
                }
            }
        };
        
        label_rebinder.prototype._hndl_ev = function(evid, linfo = null) {
            var epool = this._dyn_evs.epool(evid);
            if(!epool) return;
            var src_text = epool['@ui_label'];
            var _new_lb = true;
            if(linfo) {
                epool['@ui_label'] = linfo.text;
                epool['@ui_label_set'] = linfo.set;
                if(src_text) {
                    _new_lb = false;
                }
            } else if(!src_text) {
                return;
            }
            var lb;
            var key = 'ev_' + evid;
            if(_new_lb){
                lb = new ui_label_ev(() => epool['@ui_label']);
            } else {
                lb = this._labels_pool[key];
            }
            label_setting(lb, epool['@ui_label_set']);
            if(_new_lb) {
                lb.bind(evid);
                this._set_lpool(key, lb);
            }
        };
        
        label_rebinder.prototype._cln_ev = function(evid) {
            var epool = this._dyn_evs.epool(evid);
            if(epool) {
                delete epool['@ui_label'];
                delete epool['@ui_label_set'];
            }
        };
        
        label_rebinder.prototype._rebind_ev = function() {
            for(var evid = 1; evid < g_map()._events.length; evid ++) {
                this._hndl_ev(evid);
            }
        };
        
        label_rebinder.prototype.bind_ev = function() {
            for(var evid = 1; evid < g_map()._events.length; evid ++) {
                if(!this._labels_pool['ev_' + evid]) {
                    this._hndl_ev(evid);
                }
            }
        };
        
        label_rebinder.prototype._hndl_nm = function(key, labels_info, linfo = null) {
            if(!labels_info) return;
            var src_linfo = (labels_info && labels_info[key]);
            var _new_lb = true;
            if(linfo) {
                if(src_linfo) {
                    if(src_linfo.type != linfo.type) return null;
                    Object.assign(src_linfo, linfo);
                    _new_lb = false;
                } else {
                    labels_info[key] = linfo;
                    src_linfo = linfo;
                }
            } else if(!src_linfo) {
                return;
            }
            var lb;
            if(_new_lb) {
                var _txt = () => src_linfo.text
                if(src_linfo.type == 'player') {
                    lb = new ui_label_ev(_txt);
                } else if(src_linfo.type == 'map') {
                    lb = new ui_label_map(_txt);
                } else {
                    lb = new ui_label_base(_txt);
                }
            } else {
                lb = this._labels_pool[key];
            }
            label_setting(lb, src_linfo.set);
            if(_new_lb) {
                if(src_linfo.type == 'player') {
                    lb.bind(0);
                } else {
                    lb.bind();
                }
                this._set_lpool(key, lb);
            }
        };
        
        label_rebinder.prototype._rebind_ui = function(mid) {
            var labels_info = this._store.get(mid, 'labels_info');
            if(!labels_info) return;
            for(var key in labels_info) {
                this._hndl_nm(key, labels_info);
            }
        };
        
        label_rebinder.prototype.rebind = function(mid) {
            this._rebind_ev();
            this._rebind_ui(mid);
        };
        
        label_rebinder.prototype.label_ex = function(key, text, type, setting) {
            var linfo = {
                text: text,
                type: type,
                set: setting,
            };
            if(type == 'event') {
                var evid = key;
                this._hndl_ev(evid, linfo);
            } else {
                var mid = this._store.mapid();
                var labels_info = this._store.get(mid, 'labels_info');
                if(!labels_info) {
                    labels_info = {};
                    this._store.set(mid, 'labels_info', labels_info);
                }
                this._hndl_nm(key, labels_info, linfo);
            }
        };
        
        label_rebinder.prototype.label = function(key, text, type, pos = null) {
            var setting = pos ? {pos: [pos]} : null;
            this.label_ex(key, text, type, setting);
        };
        
        label_rebinder.prototype.remove = function(key) {
            if(this._labels_pool[key]) {
                this._labels_pool[key].remove();
                delete this._labels_pool[key];
            }
            var labels_info = this._store.get(this._store.mapid(), 'labels_info');
            if(labels_info && labels_info[key]) {
                delete labels_info[key];
            }
            if(key.slice(0, 3) == 'ev_') {
                var evid = parseInt(key.slice(3));
                if(!isNaN(evid)) {
                    this._cln_ev(evid);
                }
            }
        };
        
        return label_rebinder;
        
    })();
    
    return label_rebinder;
    
})();

var g_ui_label = new ui_label(g_d_ev);
