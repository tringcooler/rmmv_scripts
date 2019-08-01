
var tile_maker = (function() {

    var TYPA = {
        none: 0x00,
        port: 0x01,
        land: 0x02,
        wall: 0x03,
        cent: 0x04,
        msk_base: 0x03,
        msk_extr: 0x0a,
    };
    
    var a_ow = (bot, top) => ((bot | top) & TYPA.msk_extr) | Math.max(bot & TYPA.msk_base, top & TYPA.msk_base);
    
    var TYPC = {
        name_wall: ['left', 'up', 'right', 'down'],
        wall: [0x01, 0x02, 0x04, 0x08],
        cent: 0x10,
        msk_terr: 0xff,
        msk_evnt: 0xff00,
    };
    
    var c2e = c => c >> 8;
    
    var TYPE = {
        
    };
    
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
        
        area_pool.prototype.each = function(cb, aflags) {
            for(var rx in this._pool) {
                for(var ry in this._pool[rx]) {
                    var area = this._pool[rx][ry];
                    if(!(area & aflags)) continue;
                    var r = cb(rx, ry, area);
                    if(r === false) break;
                }
            }
        };
        
        return area_pool;
        
    })();

    var tile_unit = (function() {
        
        function tile_unit(code) {
            this._apool = {};
            this.parse(code);
        }
        
        tile_unit.prototype.parse = function(code) {
            this._events = c2e(code);
            
        };
        
        return tile_unit;
        
    })();

    var tile_inner = (function() {
    })();

    var tile_inter = (function() {
    })();

})();
