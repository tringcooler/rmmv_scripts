
var dynamic_events = (function() {
    
    function dynamic_events() {
        this._nevents = new store_pool('dynamic_events');
        this._hook_plugin();
        this._hook_map_load();
    }
    
    var d_ev = function() {
        return $dataMap.events;
    };
    
    var g_ev = function() {
        return $gameMap._events;
    };
    
    var mapid = function() {
        return $gameMap.mapId();
    };
    
    var setup_event = function(de_idx) {
        if(de_idx >= d_ev().length || de_idx < g_ev().length) return;
        g_ev()[de_idx] = new Game_Event(mapid(), de_idx);
    };
    
    var cscene = function() {
        return SceneManager._scene;
    };
    
    var reset_charas = function() {
        var sc = cscene();
        if(sc instanceof Scene_Map) {
            sc._spriteset.hideCharacters();
            sc._spriteset.createCharacters();
        }
    };
    
    dynamic_events.prototype.refresh_events = function() {
        var [dl, gl] = [d_ev().length, g_ev().length]
        if(dl <= gl) return;
        for(var i = gl; i < dl; i++) {
            setup_event(i);
        }
        reset_charas();
    };
    
    var _clone_event = function(src_ev, id, x, y) {
        var dst_ev = Object.assign({}, src_ev);
        if(x !== null) {
            dst_ev.x = x;
        }
        if(y !== null) {
            dst_ev.y = y;
        }
        dst_ev.id = id;
        return dst_ev;
    };
    
    var clone_event = function(base_idx, x = null, y = null) {
        var src_ev = d_ev()[base_idx];
        if(!src_ev) return undefined;
        var dst_ev = _clone_event(src_ev, d_ev().length, x, y);
        d_ev().push(dst_ev);
        return dst_ev;
    };
    
    dynamic_events.prototype.clone_event = function(...args) {
        var dst_ev = clone_event(...args);
        if(dst_ev) {
            this._nevents.set(mapid(), dst_ev.id, args);
        }
        return dst_ev;
    };
    
    dynamic_events.prototype.del_event = function(de_idx) {
        if(g_ev()[de_idx]) {
            delete g_ev()[de_idx];
        }
        if(d_ev()[de_idx]) {
            d_ev()[de_idx] = null;
            this._nevents.set(mapid(), de_idx, null);
        }
    };
    
    dynamic_events.prototype.resume_events = function() {
        var cpool = this._nevents.get(mapid());
        if(!cpool) return;
        var de_idxs = Object.keys(cpool);
        de_idxs.sort((a, b) => a - b);
        for(var de_idx in cpool) {
            de_idx = parseInt(de_idx);
            var ev_args = cpool[de_idx];
            if(ev_args) {
                var base_idx = ev_args[0];
                var src_ev = d_ev()[base_idx];
                if(!src_ev) continue;
                d_ev()[de_idx] = _clone_event(src_ev, de_idx, ...ev_args.slice(1));
            } else {
                d_ev()[de_idx] = null;
            }
        }
    };
    
    dynamic_events.prototype._hook_map_load = function() {
        var _o_dm_onload = DataManager.onLoad;
        DataManager.onLoad = object => {
            _o_dm_onload.call(DataManager, object);
            if(object === $dataMap) {
                this.resume_events();
            }
        };
    };
    
    var _vguess = function(v) {
        var flt_v = parseFloat(v);
        if(flt_v == v) {
            return flt_v
        } else {
            return v;
        }
    };
    
    var gval = function(id) {
        if(id === undefined) {
            return undefined;
        } else if(id[0] == '#') {
            return $gameVariables.value(parseInt(id.slice(1)));
        } else {
            return _vguess(id);
        }
    };
    var sval = (id, val) => $gameVariables.setValue(parseInt(id), parseInt(val));
    
    dynamic_events.prototype._hook_plugin = function() {
        var _o_plg_cmd = Game_Interpreter.prototype.pluginCommand;
        var self = this;
        Game_Interpreter.prototype.pluginCommand = function(command, args) {
            _o_plg_cmd.call(this, command, args);
            if(command == 'clone_event') {
                var id = gval(args.shift());
                var x = gval(args.shift());
                var y = gval(args.shift());
                self.clone_event(id, x, y);
                self.refresh_events();
            } else if(command == 'this_pool') {
                var this_ev = g_ev()[this._eventId];
                if(!this_ev) return;
                if(!this_ev._plugin_dynamic_events_pool) {
                    this_ev._plugin_dynamic_events_pool = {};
                }
                var epool = this_ev._plugin_dynamic_events_pool;
                var scmd = args.shift();
                var sargs = args.map(v => gval(v));
                var sdst = sargs.pop();
                if(scmd == 'get') {
                    var _t = pool_util.get(sargs, epool);
                    if(isNaN(parseInt(_t))) {
                        _t = 0;
                    };
                    sval(sdst, _t);
                } else if(scmd == 'set') {
                    if(sargs.length <= 0) return;
                    return pool_util.set(sargs, epool, sdst);
                }
            }
        };
    };
    
    return dynamic_events;
    
})();

var g_d_ev = new dynamic_events();
