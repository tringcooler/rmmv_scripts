
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
    
    dynamic_events.prototype.epool = function(ev) {
        if(!ev) return undefined;
        if(!ev._plugin_dynamic_events_pool) {
            ev._plugin_dynamic_events_pool = {};
        }
        return ev._plugin_dynamic_events_pool;
    };
    
    dynamic_events.prototype.this_epool = function(interp) {
        var this_ev = g_ev()[interp._eventId];
        if(!this_ev) return undefined;
        return this.epool(this_ev);
    };
    
    dynamic_events.prototype._hook_plugin = function() {
        plugin_util.hook((command, args, interp) => {
            if(command == 'clone_event') {
                var id = plugin_util.gval(args.shift());
                var x = plugin_util.gval(args.shift());
                var y = plugin_util.gval(args.shift());
                this.clone_event(id, x, y);
                this.refresh_events();
            } else if(command == 'this_pool') {
                var epool = this.this_epool(interp);
                if(!epool) return;
                var scmd = args.shift();
                var sargs = args.map(v => plugin_util.gval(v));
                var sdst = sargs.pop();
                if(scmd == 'get') {
                    plugin_util.sval(sdst, pool_util.get(sargs, epool));
                } else if(scmd == 'set') {
                    if(sargs.length <= 0) return;
                    pool_util.set(sargs, epool, sdst);
                }
            }
        });
    };
    
    return dynamic_events;
    
})();

var g_d_ev = new dynamic_events();
