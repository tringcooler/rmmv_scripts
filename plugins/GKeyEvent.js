
var area_checker = (function() {
    
    function area_checker(map_strr, dyn_evs, area_id, dir_face = false, ev_pass = true) {
        this._map = map_strr;
        this._evs = dyn_evs;
        this._area = area_id;
        this._dface = dir_face;
        this._epass = ev_pass;
    }
    
    area_checker.prototype._get_area = function(x, y) {
        return this._map.get_tile(x, y, 5);
    };
    
    var p_ch = function() {
        return $gamePlayer;
    };
    
    var face_pos = function(spos, dir) {
        var rpos = [spos[0], spos[1]];
        var sign;
        if(dir & 2) {
            sign = 1;
        } else {
            sign = -1;
        }
        if(dir & 4) {
            rpos[0] += sign;
        } else {
            rpos[1] += sign;
        }
        return rpos;
    };
    
    area_checker.prototype._tar_pos = function() {
        var ppos = [p_ch().x, p_ch().y];
        var pdir = p_ch().direction();
        if(this._dface) {
            var tpos = face_pos(ppos, pdir);
            return [tpos, [tpos.concat(1), ppos.concat(0)]];
        } else {
            return [ppos, [ppos.concat(0)]];
        }
    };
    
    area_checker.prototype.check = function() {
        var [t_pos, ev_rng] = this._tar_pos();
        var t_area = this._get_area(...t_pos);
        if(t_area != this._area) return false;
        if(t_area != this._area
            || (this._epass
            && this._evs.range_has_event(...ev_rng) ) ) {
            return false;
        }
        return t_pos;
    };
    
    return area_checker;
    
})();

var gkey_event = (function() {
    
    function gkey_event(map_strr, dyn_evs) {
        this._map = map_strr;
        this._evs = dyn_evs;
        this._tpool = {};
        this._hook_plugin();
    }
    
    gkey_event.prototype.trigger = function(prio, sw_id, area_id, dir_face) {
        var ac_key = area_id + (dir_face ? '_fc' : '_ft');
        if(this._tpool[ac_key]) {
            var [_tpr, _tev, _tac] = this._tpool[ac_key];
            if(_tpr >= prio) {
                return [_tev, _tac];
            }
        }
        var n_ac = new area_checker(this._map, this._evs, area_id, dir_face, prio >= 0);
        this._tpool[ac_key] = [prio, sw_id, n_ac];
        return [sw_id, n_ac];
    };
    
    gkey_event.prototype._key_press = function(suc = false) {
        if(suc) {
            return !!this._suc_press;
        }
        var press = Input.isPressed('ok');
        var is_press = false;
        if(!this._last_press && press) {
            is_press = true;
        }
        this._last_press = press;
        this._suc_press = is_press;
        return is_press;
    };
    
    gkey_event.prototype._hook_plugin = function() {
        plugin_util.hook((command, args, interp) => {
            if(command == 'gkey_press') {
                var suc = false;
                if(args[0] == 'suc') {
                    args.shift();
                    suc = true;
                }
                if(!this._key_press(suc)) return;
                var vargs = args.map(a => plugin_util.gval(a));
                var [sw_id, achkr] = ((sw_id, area_id, dir_face = false, prio = 10) => {
                    dir_face = !!dir_face;
                    return this.trigger(prio, sw_id, area_id, dir_face);
                })(...vargs);
                var t_pos = achkr.check();
                if(t_pos) {
                    var epool = this._evs.this_epool(interp);
                    if(epool) {
                        pool_util.set(['gkey_pos', 'x'], epool, t_pos[0]);
                        pool_util.set(['gkey_pos', 'y'], epool, t_pos[1]);
                    }
                    plugin_util.sw(sw_id, true);
                }
            }
        });
    };
    
    return gkey_event;
    
})();

var g_gk_ev = new gkey_event(g_map_s, g_d_ev);
