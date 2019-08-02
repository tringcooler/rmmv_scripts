
var pool_util = (function() {
    
    var _get = function(idxs, pool) {
        if(idxs.length == 0 || !pool) {
            return undefined;
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
    
    var _each = function(pool, cb, path = null) {
        if(path === null) {
            path = [];
        }
        if(pool instanceof Object) {
            for(var k in pool) {
                var r = _each(pool[k], cb, [k].concat(path));
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
    
    return {
        'get': _get,
        'set': _set,
        'each': _each,
    };
    
})();

var store_pool = (function() {
    
    /*var SP_LIST = [];
    var _clear_pools = function() {
        for(var sp of SP_LIST) {
            delete sp._pool;
        }
    };
    var _o_aload = Game_System.prototype.onAfterLoad;
    Game_System.prototype.onAfterLoad = function() {
        _o_aload.call(this);
        _clear_pools();
    };
    var _o_cgame = DataManager.createGameObjects;
    DataManager.createGameObjects = function() {
        _o_cgame.call(this);
        _clear_pools();
    };*/
    
    function store_pool(name) {
        this._name = name;
        //SP_LIST.push(this);
    }
    
    store_pool.prototype.pool = function() {
        //if(!this._pool) {
            if(!$gameVariables._plugin_store_pool) {
                $gameVariables._plugin_store_pool = {};
            }
            if(!$gameVariables._plugin_store_pool[this._name]) {
                $gameVariables._plugin_store_pool[this._name] = {};
            }
            //this._pool = $gameVariables._plugin_store_pool[this._name];
            return $gameVariables._plugin_store_pool[this._name];
        //}
        //return this._pool;
    };
    
    store_pool.prototype.get = function(...idxs) {
        return pool_util.get(idxs, this.pool());
    };
    
    store_pool.prototype.set = function(...idxs) {
        var val = idxs.pop();
        if(idxs.length <= 0) return;
        return pool_util.set(idxs, this.pool(), val);
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
        'hook': hook,
    };
    
})();

var map_stirrer = (function() {
    
    function map_stirrer() {
        this._ntiles = new store_pool('map_stirrer');
        this._hook_plugin();
        this._hook_map_load();
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
    
    map_stirrer.prototype.resume_tiles = function() {
        var cpool = this._ntiles.get(mapid());
        if(!cpool) return;
        for(var pidx in cpool) {
            pidx = parseInt(pidx);
            mapdata()[pidx] = cpool[pidx];
        }
    };
    
    map_stirrer.prototype._hook_map_load = function() {
        var _o_dm_onload = DataManager.onLoad;
        DataManager.onLoad = object => {
            _o_dm_onload.call(DataManager, object);
            if(object === $dataMap) {
                this.resume_tiles();
            }
        };
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
