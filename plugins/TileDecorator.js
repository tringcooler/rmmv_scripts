
var tile_decorator = (function() {
    
    /*var cell2num = c => c.reduce((r, v, i) => r + (v << i), 0);
    var num2cell = n => {
        var cell = [];
        while(n) {
            cell.push(n % 2);
            n >>= 1;
        }
        return cell;
    };*/
    
    var cell2num = c => parseInt(c.map(v => v ? 1 : 0).reverse().join(''), 2);
    var num2cell = n => n.toString(2).split('').map(v => v == '1').reverse();
    var chk_vnum = n => {
        var vnum_msks = [
            [1 << 4, 1 << 4 | 1 << 3 | 1 << 0],
            [1 << 5, 1 << 5 | 1 << 0 | 1 << 1],
            [1 << 6, 1 << 6 | 1 << 1 | 1 << 2],
            [1 << 7, 1 << 7 | 1 << 2 | 1 << 3],
        ];
        for(var [e, msk] of vnum_msks) {
            if(!(n & e)) continue;
            if((n & msk) != msk) {
                return false;
            }
        }
        return true;
    };
    var get_pos_seq = pos => {
        var rel_seq = [
            [-1, -1], [1, -1], [1, 1], [-1, 1],
            [-1, 0], [0, -1], [1, 0], [0, 1],
        ];
        var pos_rm = pos.slice(2);
        return rel_seq.map(rel => [rel[0] + pos[0], rel[1] + pos[1], ...pos_rm]);
    };
    var SEQ_TILE_TYPES = [...Array((1 << 8) - 1).keys()].filter(n => chk_vnum(n)).reduce((r, v, i) => {r[v] = i; return r}, {});
    
    function tile_decorator(map_strr, tiles_base, tiles_range = 48, tiles_page = 1) {
        this._map = map_strr;
        this._tbase = tiles_base;
        this._trange = tiles_range;
        this._tpage = tiles_page;
    }
    
    tile_decorator.prototype._get_tile_base = function(tile) {
        var tidx = tile - this._tbase;
        if(tidx < 0 || tidx >= this._trange * this._tpage) return null;
        return this._tbase + Math.floor(tidx / this._trange) * this._trange;
    };
    
    tile_decorator.prototype._get_map_by_cache = function(cache, pos) {
        var c = cache;
        for(var i of pos.slice(0, -1)) {
            if(!(i in c)) {
                c[i] = {};
            }
            c = c[i];
        }
        var plst = pos[pos.length - 1];
        if(!(plst in c)) {
            c[plst] = this._get_tile_base(this._map.get_tile(...pos));
        }
        return c[plst];
    };
    
    tile_decorator.prototype.decorate = function(pos_seq) {
        var cache = {};
        for(var pos of pos_seq) {
            var base = this._get_map_by_cache(cache, pos);
            if(base === null) continue;
            var rel_pos_seq = get_pos_seq(pos);
            var rseq = [];
            for(var rpos of rel_pos_seq) {
                rseq.push(this._get_map_by_cache(cache, rpos) === null);
            }
            var tidx = SEQ_TILE_TYPES[cell2num(rseq)];
            if(tidx === undefined) continue;
            this._map.set_tile(...pos, base + tidx);
        }
        this._map.refresh_map();
    };
    
    return tile_decorator;
    
})();
