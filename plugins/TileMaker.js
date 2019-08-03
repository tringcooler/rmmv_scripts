
var tile_maker = (function() {

    var TYPA = {
        none: 0x00,
        supp_c: 0x01,
        supp_e: 0x02,
        land: 0x04,
        wall: 0x08,
        cent: 0x10,
        port: 0x20,
        slot: 0x40,
        msk_supp: 0x03,
        msk_terr: 0x0c,
        msk_port: 0x60,
        msk_area: 0xff,
        msk_evnt: 0xff00,
        msk_ovwr: 0xfff0,
        msk_all: 0xffff,
    };
    
    var a_ow = (bot, top) => ((bot | top) & TYPA.msk_ovwr) | Math.max(bot & TYPA.msk_terr, top & TYPA.msk_terr, Math.min((bot & TYPA.msk_supp) + (top & TYPA.msk_supp), TYPA.land));
    
    var TYPC = {
        name_wall: ['left', 'up', 'right', 'down'],
        wall: [0x01, 0x02, 0x04, 0x08],
        cent: 0x10,
        msk_terr: 0xff,
        msk_evnt: 0xff00,
    };
    
    var c_wall_msk2pos = {
        0x1: [-1, 0],
        0x3: [-1, -1],
        0x2: [0, -1],
        0x6: [1, -1],
        0x4: [1, 0],
        0xa: [1, 1],
        0x8: [0, 1],
        0x9: [-1, 1],
    };
    
    var e_c2a = (c, a) => (c & TYPC.msk_evnt) | (a & TYPA.msk_area);
    
    var TYPE = {
        
    };
    
    var posadd = (p1, p2) => [p1[0] + p2[0], p1[1] + p2[1]];
    
    var area_pool = (function() {
        
        function area_pool() {
            this._pool = {};
        }
        
        area_pool.prototype.set = function(pos, area) {
            var src = pool_util.get(pos, this._pool);
            if(!src) src = 0;
            var dst = a_ow(src, area);
            pool_util.set(pos, this._pool, dst);
        };
        
        area_pool.prototype.filter = function(msk, dst = 0, eq = false) {
            return a => eq ? ((a & msk) == dst) : ((a & msk) != dst);
        };
        
        area_pool.prototype.each = function(cb, ...filters) {
            pool_util.each(this._pool, (kx, ky, area) => {
                var rx = parseInt(kx);
                var ry = parseInt(ky);
                if(filters.length > 0 && !filters.every(f => f(area))) return;
                return cb(rx, ry, area);
            });
        };
        
        area_pool.prototype.merge_to = function(bot, bpos = null) {
            if(bpos === null) {
                bpos = [0, 0];
            }
            this.each((tx, ty, ta) => {
                bot.set(posadd([tx, ty], bpos), ta);
            });
        };
        
        return area_pool;
        
    })();

    var tile_unit = (function() {
        
        function tile_unit(code) {
            this._apool = new area_pool();
            this.setup(code);
        }
        
        tile_unit.prototype.set_port = function() {
            this._apool.set([-2, 0], TYPA.slot);
            this._apool.set([0, -2], TYPA.slot);
            this._apool.set([2, 0], TYPA.slot);
            this._apool.set([0, 2], TYPA.slot);
            this._apool.set([-1, 0], TYPA.port);
            this._apool.set([0, -1], TYPA.port);
            this._apool.set([1, 0], TYPA.port);
            this._apool.set([0, 1], TYPA.port);
            
        };
        
        tile_unit.prototype.set_land = function() {
            for(var x = -1; x < 2; x++) {
                for(var y = -1; y < 2; y++) {
                    this._apool.set([x, y], TYPA.roof);
                }
            }
            this._apool.set([0, 0], TYPA.roof);
        };
        
        tile_unit.prototype.set_wall = function(cw) {
            for(var wm in c_wall_msk2pos) {
                if(wm & cw) {
                    this._apool.set(c_wall_msk2pos[wm], TYPA.wall);
                }
            }
        };
        
        tile_unit.prototype.set_cent = function(code) {
            if(code & TYPC.cent) {
                this._apool.set([0, 0], e_c2a(code, TYPA.cent));
            }
        };
        
        tile_unit.prototype.setup = function(code) {
            this.set_port();
            this.set_land();
            this.set_wall(code);
            this.set_cent(code);
        };
        
        return tile_unit;
        
    })();
    
    var dye_chain = (function() {
        
        var _ID = 0;
        
        function dye_chain() {
            this._prev = null;
            this._id = ++_ID;
            this._val = null;
        }
        
        dye_chain.prototype.base = function() {
            var base = this;
            while(base._prev) {
                base = base._prev;
            }
            return base;
        };
        
        dye_chain.prototype.id = function() {
            return this.base()._id;
        };
        
        dye_chain.prototype.val = function(v = null) {
            var base = this.base();
            if(v !== null) {
                base._val = v;
            }
            return base._val;
        };
        
        dye_chain.prototype.dye_by = function(src) {
            var base = this.base();
            var sbase = src.base();
            if(base === sbase) return;
            base._prev = sbase;
            base._val = null;
        };
        
        return dye_chain;
        
    })();

    var tile_inner = (function() {
        
        function tile_inner() {
            this._cpool = {};
        }
        
        tile_inner.prototype._ginfo = function(pos) {
            return pool_util.get(pos, this._cpool);
        };
        
        tile_inner.prototype._dye = function(pos) {
            var sinfo = this._ginfo(pos);
            if(!sinfo) return;
            var [scode, sdc] = sinfo;
            for(var dir = 0; dir < 4; dir++) {
                var wm = 1 << dir;
                if(scode & wm) continue;
                var rwm = 1 << ((dir + 2) % 4) ;
                var dpos = posadd(pos, c_wall_msk2pos[wm]);
                var dinfo = this._ginfo(dpos);
                if(!dinfo) {
                    sdc.val().conn += 1;
                    continue;
                }
                var [dcode, ddc] = dinfo;
                if(dcode & rwm) continue;
                sdc.val().conn += ddc.val().conn - 1;
                ddc.dye_by(sdc);
            }
        };
        
        tile_inner.prototype.set_unit = function(pos, code) {
            if(this._ginfo(pos)) return;
            var dc = new dye_chain();
            dc.val({conn: 0});
            pool_util.set(pos, this._cpool, [code, dc]);
            this._dye(pos);
        };
        
        return tile_inner;
        
    })();

    var tile_inter = (function() {
    })();
    
    return tile_inner;

})();
