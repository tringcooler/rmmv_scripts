
var tile_decorator = (function() {
    
    var cell2num = c => parseInt(c.map(v => v ? 1 : 0).reverse().join(''), 2);
    var num2cell = n => n.toString(2).split('').map(v => v == '1').reverse();
    var mod_vnum = n => {
        var vnum_msks = [
            [1 << 4, 1 << 4 | 1 << 3 | 1 << 0],
            [1 << 5, 1 << 5 | 1 << 0 | 1 << 1],
            [1 << 6, 1 << 6 | 1 << 1 | 1 << 2],
            [1 << 7, 1 << 7 | 1 << 2 | 1 << 3],
        ];
        var r = n;
        for(var [e, msk] of vnum_msks) {
            if(!(n & e)) continue;
            r |= msk;
        }
        return r;
    };
    var get_pos_seq = pos => {
        var rel_seq = [
            [-1, -1], [1, -1], [1, 1], [-1, 1],
            [-1, 0], [0, -1], [1, 0], [0, 1],
        ];
        var pos_rm = pos.slice(2);
        return rel_seq.map(rel => [rel[0] + pos[0], rel[1] + pos[1], ...pos_rm]);
    };
    SEQ_TILE_TYPES = (() => {
        var mod_seq = [];
        var vnum_seq = {};
        var vi = 0;
        var h4seq = [0, 1, 2, 4, 8, 5, 10, 3, 6, 12, 9, 7, 11, 13, 14, 15];
        var l4rng = 1 << 4;
        var rng = 1 << 8;
        for(var h4i of h4seq) {
            for(var l4i = 0; l4i < l4rng; l4i++) {
                var i = (h4i << 4 | l4i);
                var mi = mod_vnum(i);
                mod_seq[i] = mi;
                if(mi == i) {
                    vnum_seq[i] = vi ++;
                }
            }
        }
        console.log(Object.keys(vnum_seq).reduce((r, k) => {r[parseInt(k).toString(2)] = vnum_seq[k]; return r}, {}));
        for(var i = 0; i < rng; i++) {
            mod_seq[i] = vnum_seq[mod_seq[i]];
        }
        return mod_seq;
    })();
    
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
            this._map.set_tile(...pos, base + tidx);
        }
        this._map.refresh_map();
    };
    
    return tile_decorator;
    
})();
