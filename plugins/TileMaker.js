
var tile_maker = (function() {

    var TYPA = {
        none: 0x00,
        port: 0x01,
        land: 0x02,
        wall: 0x03,
        cent: 0x04,
        msk_base: 0x03,
        msk_extr: 0x0a,
        msk_offs: 0xf0,
        msk_area: 0xff,
        msk_evnt: 0xff00,
        msk_ovwr: 0xfffa,
        msk_all: 0xffff,
    };
    
    var a_ow = (bot, top) => ((bot | top) & TYPA.msk_ovwr) | Math.max(bot & TYPA.msk_base, top & TYPA.msk_base);
    
    var TYPC = {
        name_wall: ['left', 'up', 'right', 'down'],
        wall: [0x01, 0x02, 0x04, 0x08],
        cent: 0x10,
        msk_terr: 0xff,
        msk_evnt: 0xff00,
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
        
        area_pool.prototype.each = function(cb, aflags = TYPA.msk_all) {
            for(var rx in this._pool) {
                for(var ry in this._pool[rx]) {
                    var area = this._pool[rx][ry];
                    if(!(area & aflags)) continue;
                    var r = cb(rx, ry, area);
                    if(r === false) {
                        break;
                    } else if(r !== undefined) {
                        this._pool[rx][ry] = r;
                    }
                }
            }
        };
        
        area_pool.prototype.merge = function(bot, bpos = null) {
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
        
        var wall_msk2pos = {
            0x1: [-1, 0],
            0x3: [-1, -1],
            0x2: [0, -1],
            0x6: [1, -1],
            0x4: [1, 0],
            0xa: [1, 1],
            0x8: [0, 1],
            0x9: [-1, 1],
        };
        
        tile_unit.prototype.set_port = function() {
            this._apool.set([-2, 0], TYPA.port);
            this._apool.set([0, -2], TYPA.port);
            this._apool.set([2, 0], TYPA.port);
            this._apool.set([0, 2], TYPA.port);
        };
        
        tile_unit.prototype.set_land = function() {
            for(var x = -1; x < 2; x++) {
                for(var y = -1; y < 2; y++) {
                    this._apool.set([x, y], TYPA.land);
                }
            }
        };
        
        tile_unit.prototype.set_wall = function(cw) {
            for(var wm in wall_msk2pos) {
                if(wm & cw) {
                    this._apool.set(wall_msk2pos[wm], TYPA.wall);
                }
            }
        };
        
        tile_unit.prototype.set_cent = function(code) {
            if(code & TYPC.cent) {
                this._apool.set([0, 0], e_c2a(code, TYPA.cent));
            }
        };
        
        tile_unit.prototype.setup = function(code) {
            this._events = c2e(code);
            this.set_port();
            this.set_land();
            this.set_wall(code);
            this.set_cent(code);
        };
        
        return tile_unit;
        
    })();

    var tile_inner = (function() {
    })();

    var tile_inter = (function() {
    })();

})();
