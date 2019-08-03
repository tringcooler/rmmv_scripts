
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
        this._last_press = {};
        this._last_dir = null;
        this._suc_press = {};
        this._hook_plugin();
    }
    
    gkey_event.prototype.trigger = function(prio, sw_id, area_id, dir_face, evpass = true) {
        var ac_key = area_id + (dir_face ? '_fc' : '_ft');
        if(this._tpool[ac_key]) {
            var [_tpr, _tev, _tac] = this._tpool[ac_key];
            if(_tpr >= prio) {
                return [_tev, _tac];
            }
        }
        var n_ac = new area_checker(this._map, this._evs, area_id, dir_face, evpass && prio >= 0);
        this._tpool[ac_key] = [prio, sw_id, n_ac];
        return [sw_id, n_ac];
    };
    
    var p_dir = function() {
        var pdir = $gamePlayer.direction();
        var sdir = null;
        if(pdir == 2) {
            sdir = 'down';
        } else if(pdir == 4) {
            sdir = 'left';
        } else if(pdir == 6) {
            sdir = 'right';
        } else if(pdir == 8) {
            sdir = 'up';
        }
        return sdir;
    };
    
    gkey_event.prototype._key_press_dir = function(tail = false, suc = false) {
        var key = p_dir();
        if(!key) return false;
        var is_pressed = this._key_press(key, suc);
        if(suc) return is_pressed;
        var dir = is_pressed ? key : null;
        var dir_is_pressed = false;
        if($gamePlayer.checkStop(1) && !dir) {
            if(this._last_dir == key && tail) {
                dir_is_pressed = true;
            }
            this._last_dir = null;
        } else if(dir && this._last_dir != dir) {
            if(!this._last_dir && !tail) {
                dir_is_pressed = true;
            }
            this._last_dir = dir;
        }
        this._suc_press[key] = dir_is_pressed;
        return dir_is_pressed;
    }
    
    gkey_event.prototype._key_press = function(key = 'ok', suc = false) {
        if(suc) {
            return !!this._suc_press[key];
        }
        var press = Input.isPressed(key);
        var is_press = false;
        if(!this._last_press[key] && press) {
            is_press = true;
        }
        this._last_press[key] = press;
        this._suc_press[key] = is_press;
        return is_press;
    };
    
    gkey_event.prototype._hook_plugin = function() {
        plugin_util.hook((command, args, interp) => {
            if(command == 'gkey_press') {
                var keydir = false;
                var keydir_tail = false;
                var suc = false;
                if(args[0] == 'dir') {
                    args.shift();
                    keydir = true;
                }
                if(args[0] == 'tail') {
                    args.shift();
                    keydir_tail = true;
                }
                if(args[0] == 'suc') {
                    args.shift();
                    suc = true;
                }
                var is_pressed;
                if(keydir) {
                    is_pressed = this._key_press_dir(keydir_tail, suc);
                } else {
                    is_pressed = this._key_press('ok', suc);
                }
                if(!is_pressed) return;
                var vargs = args.map(a => plugin_util.gval(a));
                var [sw_id, achkr] = ((sw_id, area_id, dir_face = false, prio = 10) => {
                    dir_face = !!dir_face;
                    return this.trigger(prio, sw_id, area_id, dir_face, !keydir);
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
