var tile_board = (function() {
    
    var TYPA = {
        land: 0x04,
        wall: 0x08,
        port: 0x10,
        cent: 0x80,
        msk_area: 0xff,
        msk_evnt: 0x7f00,
    };
    
    var a2e = a => (a & TYPA.msk_evnt) / (TYPA.msk_area + 1);
    
    var map_pool_hook = [
        g_map_s,
    {
        get: (pos, map) => map.get_tile(pos[0], pos[1], 5),
        set: (pos, map, val) => map.get_tile(pos[0], pos[1], 5, val),
        each: (map, cb) => map.layer_each(5, cb),
    }];
    
    function tile_board() {
        this._map = new tile_map(maphook);
    }
    
    tile_board.prototype.new_deck = function(seed) {
    };
    
    testf = function() {
    };
    
    return tile_board;
    
})();
