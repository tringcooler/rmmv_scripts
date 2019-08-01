
var tile_maker = (function() {

    var TYPA = {
        none: 0x00,
        port: 0x01,
        land: 0x02,
        wall: 0x04,
        cent: 0x10,
        msk_base: 0x0f,
        msk_extr: 0xf0,
    };
    
    var a_ow = (bot, top) => (v => (v & TYPA.msk_extr) | Math.max(v & TYPA.port, v & TYPA.land, v & TYPA.wall))(bot | top);
    
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

    var tile_unit = (function() {
        
        function tile_unit(code) {
            this._apool = {};
            this.parse(code);
        }
        
        tile_unit.prototype.parse = function(code) {
            this._events = c2e(code);
            
        };
        
        tile_unit.prototype.each = function(cb, aflags) {
            for(var rx in this._apool) {
                for(var ry in this._apool[rx]) {
                    var area = this._apool[rx][ry];
                    if(!(area & aflags)) continue;
                    var r = cb(rx, ry, area);
                    if(r === false) break;
                }
            }
        };
        
        return tile_unit;
        
    })();

    var tile_inner = (function() {
    })();

    var tile_inter = (function() {
    })();

})();
