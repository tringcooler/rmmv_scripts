
var area_checker = (function() {
    
    function area_checker(map_strr, area_id, dir_face = false, ev_pass = true) {
        this._map = map_strr;
        this._area = area_id;
        this._dface = dir_face;
        this._epass = ev_pass;
        this._hook_plugin();
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
            return face_pos(ppos, pdir);
        } else {
            return ppos;
        }
    };
    
    var a_ev = function() {
        return $gameMap.events();
    };
    
    area_checker.prototype.check = function() {
        var t_pos = this._tar_pos();
        var t_area = this._get_area(...t_pos);
        if(t_area != this._area) return false;
        if(!this._epass) return true;
        return !a_ev.some(ev => ev.x == t_pos[0] && ev.y == tpos[1]);
    };
    
    return area_checker;
    
})();

var gkey_event = (function() {
    
    function gkey_event(map_strr) {
        this._map = map_strr;
        this._hook_plugin();
    }
    
    gkey_event.prototype._hook_plugin = function() {
        plugin_util.hook((command, args, interp) => {
            if(command == 'gkey_press') {
                
            }
        });
    };
    
    return gkey_event;
    
})();


