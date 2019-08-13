var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    d.prototype = Object.create(b.prototype);
    d.prototype.constructor = d;
};

var __supermethod = this.__supermethod || function (_spr, _slf, mth) {
    if(_spr.prototype[mth]) {
        return _spr.prototype[mth].bind(_slf);
    } else {
        return function() {};
    }
};

var pool_util = (function() {
    
    var _get = function(idxs, pool) {
        if(!pool) {
            return undefined;
        } else if(idxs.length == 0) {
            return pool;
        } else if(idxs.length == 1) {
            return pool[idxs[0]];
        } else {
            return _get(idxs.slice(1), pool[idxs[0]]);
        }
    };
    
    var _set = function(idxs, pool, val) {
        if(idxs.length == 0) {
            return;
        } else if(idxs.length == 1) {
            pool[idxs[0]] = val;
        } else {
            if(!pool[idxs[0]]) {
                pool[idxs[0]] = {};
            }
            _set(idxs.slice(1), pool[idxs[0]], val);
        }
    };
    
    var _each = function(pool, cb, deep = -1, path = null) {
        if(path === null) {
            path = [];
        }
        if(deep != 0 && pool instanceof Object) {
            for(var k in pool) {
                var r = _each(pool[k], cb, deep - 1, path.concat(k));
                if(r === false) {
                    return false;
                } else if(r !== undefined) {
                    pool[k] = r;
                }
            }
        } else {
            return cb(...path, pool);
        }
    };
    
    var _evstr = function(idxs, pool) {
        if(idxs.length == 0) return;
        var key = idxs[idxs.length - 1];
        var evpool = _get(idxs.slice(0, -1), pool);
        var text = evpool[key];
        if(!text || !(typeof text == 'string')) return;
        if(text.slice(0, 4) == '@ev:') {
            text = text.slice(4);
            var $ = evpool;
            return () => eval(text);
        } else {
            return () => evpool[key];
        }
    };
    
    return {
        'get': _get,
        'set': _set,
        'each': _each,
        'evstr' : _evstr,
    };
    
})();

var store_pool = (function() {
    
    function ev_onload() {}
    
    ev_onload.prototype.on = function(cb) {
        var eidx = this._events_onload.indexOf(cb);
        if(eidx < 0) {
            this._events_onload.push(cb);
        }
    };
    
    ev_onload.prototype.off = function(cb) {
        var eidx = this._events_onload.indexOf(cb);
        if(eidx >= 0) {
            this._events_onload.splice(eidx, 1);
        }
    };
    
    ev_onload.prototype._hook_map_load = function() {
        this._events_onload = [];
        var _o_dm_onload = DataManager.onLoad;
        DataManager.onLoad = object => {
            _o_dm_onload.call(DataManager, object);
            if(object === $dataMap) {
                var mid = SceneManager._scene._transfer ? $gamePlayer.newMapId() : $gameMap.mapId();
                for(var ev of this._events_onload) {
                    ev(mid);
                }
            }
        };
    };
    
    ev_onload.prototype._hook_scene_load = function() {
        this._events_onload = [];
        var _o_sc_onload = Scene_Map.prototype.onMapLoaded;
        var self = this;
        Scene_Map.prototype.onMapLoaded = function() {
            _o_sc_onload.call(this);
            var mid = $gameMap.mapId();
            for(var ev of self._events_onload) {
                ev(mid);
            }
        };
    };
    
    ev_onload.prototype.hook = function(type) {
        if(type == 'map') {
            this._hook_map_load();
        } else if(type == 'scene') {
            this._hook_scene_load();
        }
        return this;
    };
    
    function store_pool(name) {
        this._name = name;
    }
    
    store_pool.prototype.load = (new ev_onload()).hook('map');
    store_pool.prototype.load2 = (new ev_onload()).hook('scene');
    
    store_pool.prototype.pool = function() {
        if(!$gameVariables._plugin_store_pool) {
            $gameVariables._plugin_store_pool = {};
        }
        if(!$gameVariables._plugin_store_pool[this._name]) {
            $gameVariables._plugin_store_pool[this._name] = {};
        }
        return $gameVariables._plugin_store_pool[this._name];
    };
    
    store_pool.prototype.get = function(...idxs) {
        return pool_util.get(idxs, this.pool());
    };
    
    store_pool.prototype.set = function(...idxs) {
        var val = idxs.pop();
        if(idxs.length <= 0) return;
        return pool_util.set(idxs, this.pool(), val);
    };
    
    store_pool.prototype.mapid = function() {
        return $gameMap.mapId();
    };
    
    return store_pool;
    
})();

var auto_off = (function() {
    
    var CLR_LIST = [];
    var _o_bsave = Game_System.prototype.onBeforeSave;
    Game_System.prototype.onBeforeSave = function() {
        _o_bsave.call(this);
        for(var sid of CLR_LIST) {
            $gameSwitches.setValue(sid, false);
        }
    };
    
    return function(sid) {
        if(CLR_LIST.indexOf(sid) < 0) {
            CLR_LIST.push(sid);
        }
    };
    
})();

var plugin_util = (function() {
    
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
    
    var sval = function(id, val) {
        var iid = parseInt(id);
        if(isNaN(iid)) return;
        var ival = parseInt(val);
        if(isNaN(ival)) {
            ival = 0;
        }
        $gameVariables.setValue(iid, ival);
    };
    
    var sw = function(id, s = null) {
        var iid = parseInt(id);
        if(isNaN(iid)) return false;
        if(s !== null) {
            $gameSwitches.setValue(id, !!s);
        }
        return $gameSwitches.value(id);
    };
    
    var evsw = function(evid, sid, s = null) {
        evid = parseInt(evid);
        sid = (sid && sid.toUpperCase && sid.toUpperCase());
        if(isNaN(evid) || 'ABCD'.split('').indexOf(sid) < 0) return false;
        var key = [$gameMap.mapId(), evid, sid];
        if(s !== null) {
            $gameSelfSwitches.setValue(key, !!s);
        }
        return $gameSelfSwitches.value(key);
    };
    
    var hook = function(func) {
        var _o_plg_cmd = Game_Interpreter.prototype.pluginCommand;
        Game_Interpreter.prototype.pluginCommand = function(command, args) {
            _o_plg_cmd.call(this, command, args);
            return func(command, args, this);
        };
    };
    
    return {
        'gval': gval,
        'sval': sval,
        'sw': sw,
        'evsw': evsw,
        'hook': hook,
    };
    
})();

var map_stirrer = (function() {
    
    function map_stirrer() {
        this._ntiles = new store_pool('map_stirrer');
        this._hook_plugin();
        this._ntiles.load.on(this.resume_tiles.bind(this));
    }
    
    var cscene = function() {
        return SceneManager._scene;
    };
    
    map_stirrer.prototype.refresh_map = function() {
        var sc = cscene();
        if(sc instanceof Scene_Map) {
            sc._spriteset._tilemap.refresh();
        }
    };
    
    var mod = (a, b) => ((a, b) => a * b < 0 ? a + b : a)(a % b, b);
    var pos2idx = function(x, y, z) {
        return (z * $gameMap.height() + mod(y, $gameMap.height())) * $gameMap.width() + mod(x, $gameMap.width());
    };
    
    var idx2pos = function(pidx) {
        var layer_size = $gameMap.height() * $gameMap.width();
        var z = Math.floor(pidx / layer_size);
        var lidx = mod(pidx, layer_size);
        var y = Math.floor(lidx / $gameMap.width());
        var x = mod(lidx, $gameMap.width());
        return [x, y, z];
    };
    
    var mapdata = function() {
        return $gameMap.data();
    };
    
    var mapid = function() {
        return $gameMap.mapId();
    };
    
    map_stirrer.prototype.get_tile = function(x, y, z) {
        var pidx = pos2idx(x, y, z);
        return mapdata()[pidx];
    };
    
    map_stirrer.prototype.set_tile = function(x, y, z, id) {
        var pidx = pos2idx(x, y, z);
        this._ntiles.set(mapid(), pidx, id);
        mapdata()[pidx] = id;
    };
    
    map_stirrer.prototype.layer_each = function(z, cb) {
        var lstart = pos2idx(0, 0, z);
        var lend = pos2idx(0, 0, z + 1);
        for(var pidx = lstart; pidx < lend; pidx ++) {
            var [x, y, z] = idx2pos(pidx);
            var id = mapdata()[pidx];
            if(id) {
                var r = cb(x, y, id);
                if(r === false) {
                    break;
                } else if(r !== undefined) {
                    this.set_tile(x, y, z, id);
                }
            }
        }
    };
    
    map_stirrer.prototype.resume_tiles = function(mid) {
        var cpool = this._ntiles.get(mid);
        if(!cpool) return;
        for(var pidx in cpool) {
            pidx = parseInt(pidx);
            mapdata()[pidx] = cpool[pidx];
        }
    };
    
    map_stirrer.prototype._hook_plugin = function() {
        plugin_util.hook((command, args, interp) => {
            if(command == 'set_tile') {
                var x = plugin_util.gval(args.shift());
                var y = plugin_util.gval(args.shift());
                var z = plugin_util.gval(args.shift());
                var id = plugin_util.gval(args.shift());
                this.set_tile(x, y, z, id);
                this.refresh_map();
            }
        });
    };
    
    return map_stirrer;
    
})();

var g_map_s = new map_stirrer();
