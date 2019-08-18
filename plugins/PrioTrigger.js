
var prio_trigger = (function() {
    
    function prio_trigger() {
        this._trig_seq = [];
        this._hook_plugin();
        this._hook_ev_condi();
        this._hook_map_refresh();
    }
    
    prio_trigger.prototype.emit = function(key, sw = null) {
        this._trig_seq.push({
            key: key,
            sw: sw,
            prio_seq : [0],
        });
    };
    
    prio_trigger.prototype._is_triggered = function(key, prio) {
        var trig = this._trig_seq[0];
        if(!trig || key != trig.key) return false;
        if(prio == trig.prio_seq[0]) return trig;
        if(trig.prio_seq[0] == 0 && trig.prio_seq.indexOf(prio) < 0) {
            trig.prio_seq.push(prio);
            trig.prio_seq.sort((a, b) => a - b);
        }
        return false;
    };
    
    prio_trigger.prototype._next_prio = function() {
        var trig = this._trig_seq[0];
        if(!trig) return false;
        trig.prio_seq.shift();
        if(trig.prio_seq.length <= 0) {
            this._trig_seq.shift();
        }
        return true;
    };
    
    prio_trigger.prototype._sw_stat = function(event, key, set = null) {
        if(!this._prio_trigger_switches) {
            this._prio_trigger_switches = {};
        }
        if(set !== null) {
            this._prio_trigger_switches[key] = !!set;
        }
        return !!this._prio_trigger_switches[key];
    };
    
    var _parse_trigger = function(page) {
        var line = page.list[0];
        if(!line || line.code != 356 || !line.parameters[0]) return [];
        var cmds = line.parameters[0].split(' ');
        if(cmds[0] != '@trigger') return [];
        return [cmds[1], cmds[2] || 0];
    };
    
    prio_trigger.prototype._hook_ev_condi = function() {
        var _o_ev_mt_condi = Game_Event.prototype.meetsConditions;
        var self = this;
        Game_Event.prototype.meetsConditions = function(page) {
            if(!_o_ev_mt_condi.call(this, page)) return false;
            var [key, prio] = _parse_trigger(page);
            if(!key) return true;
            if(self._sw_stat(this, key)) return true;
            var trig = self._is_triggered(key, prio);
            if(!trig) return false;
            if(trig.sw !== null) {
                self._sw_stat(this, key, trig.sw);
            }
            return true;
        };
    };
    
    prio_trigger.prototype._hook_map_refresh = function() {
        var _o_map_refresh = Game_Map.prototype.refresh;
        var self = this;
        Game_Map.prototype.refresh = function(page) {
            _o_map_refresh.call(this);
            if(self._next_prio()) {
                this.requestRefresh();
            }
        };
    };
    
    prio_trigger.prototype._hook_plugin = function() {
        plugin_util.hook((command, args, interp) => {
            if(command == 'pt_emit') {
                var sw = (args[0] == 'on') ? true : (args[0] == 'off') ? false : null;
                if(sw !== null) args.shift();
                var key = plugin_util.gval(args.shift());
                this.emit(key, sw);
                $gameMap.requestRefresh();
            }
        });
    };
    
    return prio_trigger;
    
})();

var g_p_trig = new prio_trigger();
