
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
    
    var _get = function(idxs, pool) {
        if(idxs.length == 0) {
            return undefined;
        } else if(idxs.length == 1) {
            return pool[idxs[0]];
        } else {
            return _get(idxs.slice(1), pool[idxs[0]]);
        }
    };
    
    store_pool.prototype.get = function(...idxs) {
        return _get(idxs, this.pool());
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
    
    store_pool.prototype.set = function(...idxs) {
        var val = idxs.pop();
        if(idxs.length <= 0) return;
        return _set(idxs, this.pool(), val);
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
    
    map_stirrer.prototype.set_tile = function(x, y, z, id) {
        var pidx = pos2idx(x, y, z);
        var midx = mapid();
        this._ntiles.set(midx, pidx, id);
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
    
    var gval = function(id) {
        if(id[0] == '#') {
            return $gameVariables.value(parseInt(id.slice(1)));
        } else {
            return parseInt(id);
        }
    };
    
    map_stirrer.prototype._hook_plugin = function() {
        var _o_plg_cmd = Game_Interpreter.prototype.pluginCommand;
        var self = this;
        Game_Interpreter.prototype.pluginCommand = function(command, args) {
            _o_plg_cmd.call(this, command, args);
            if(command == 'set_tile') {
                var x = gval(args.shift());
                var y = gval(args.shift());
                var z = gval(args.shift());
                var id = gval(args.shift());
                self.set_tile(x, y, z, id);
                self.refresh_map();
            } else if(command == 'auto_off') {
                var sid = parseInt(args.shift());
                auto_off(sid);
            };
        };
    };
    
    return map_stirrer;
    
})();

var g_map_s = new map_stirrer();
