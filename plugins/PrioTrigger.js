
var prio_trigger = (function() {
    
    function prio_trigger() {
        this._trig_seq = [];
        this._hook_plugin();
        this._hook_ev_condi();
        this._hook_map_setup_event();
    }
    
    prio_trigger.prototype.emit = function(key) {
        this._trig_seq.push({
            key: key,
            prio_seq : [0],
        });
    };
    
    prio_trigger.prototype._is_triggered = function(key, prio) {
        var trig = this._trig_seq[0];
        if(!trig || key != trig.key) return false;
        if(prio == trig.prio_seq[0]) return true;
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
    
    var sw_stat = function(event, key, set = null) {
        if(!event._prio_trigger_switches) {
            event._prio_trigger_switches = {};
        }
        if(set !== null) {
            event._prio_trigger_switches.key = key;
            event._prio_trigger_switches.stat = set;
            return set;
        }
        if(event._prio_trigger_switches.key != key) return undefined;
        return event._prio_trigger_switches.stat;
    };
    
    var _parse_trigger = function(page) {
        var line = page.list[0];
        if(!line || line.code != 356 || !line.parameters[0]) return [];
        var cmds = line.parameters[0].split(' ');
        if(cmds.shift() != '@trigger') return [];
        var sw = false;
        if(cmds[0] == 'sw') {
            sw = true;
            cmds.shift();
        }
        return [cmds[0], parseInt(cmds[1] || 0), sw];
    };
    
    prio_trigger.prototype._hook_ev_condi = function() {
        var _o_ev_mt_condi = Game_Event.prototype.meetsConditions;
        var self = this;
        Game_Event.prototype.meetsConditions = function(page) {
            if(!_o_ev_mt_condi.call(this, page)) return false;
            var [key, prio, sw] = _parse_trigger(page);
            if(!key) return true;
            if(sw && self._trig_seq[0] && self._trig_seq[0].key == '@empty') {
                sw_stat(this, '@empty', true);
            }
            var sw_st = sw_stat(this, key);
            if(typeof sw_st == 'boolean') {
                if(sw_st === false && self._trig_seq.length <= 0) {
                    sw_stat(this, key, '__ready__');
                }
                return sw_st;
            }
            var r = self._is_triggered(key, prio);
            if(r && sw) {
                sw_stat(this, key, true);
            }
            return r;
        };
    };
    
    prio_trigger.prototype._hook_map_setup_event = function() {
        var _o_ma_setup_event = Game_Map.prototype.setupStartingEvent;
        var self = this;
        Game_Map.prototype.setupStartingEvent = function() {
            if(!self._is_executed) {
                if(self._next_prio()) {
                    this.requestRefresh();
                }
            }
            self._is_executed = false;
            return _o_ma_setup_event.call(this);
        };
    };
    
    prio_trigger.prototype._hook_plugin = function() {
        plugin_util.hook((command, args, interp) => {
            if(command == 'pt_emit') {
                var key = plugin_util.gval(args.shift());
                this.emit(key);
                $gameMap.requestRefresh();
                this._is_executed = true;
            } else if(command == '@trigger') {
                var sw = (args[0] == 'sw');
                if(sw) args.shift();
                var ev = $gameMap._events[interp._eventId];
                var key = plugin_util.gval(args.shift());
                if(!sw) {
                    sw_stat(ev, key, false);
                }
                this._is_executed = true;
            }
        });
    };
    
    return prio_trigger;
    
})();

var g_p_trig = new prio_trigger();
