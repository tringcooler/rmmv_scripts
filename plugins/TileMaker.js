
var tile_maker = (function() {

    var TYPA = {
        none: 0x00,
        land: 0x01,
        wall: 0x02,
        port: 0x04,
        cent: 0x08,
    };

    var tile_unit = (function() {
        
        function tile_unit() {
            this._apool = {};
        }
        
        tile_unit.prototype.each = function(cb, ...areas) {
            var alen = areas.length;
            for(var rx in this._apool) {
                for(var ry in this._apool[rx]) {
                    var area = this._apool[rx][ry];
                    if(alen > 0 && areas.indexOf(area) < 0) continue;
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
