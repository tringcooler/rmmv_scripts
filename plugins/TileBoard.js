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
    
    function tile_board() {
        
    }
    
    testf = function() {
    };
    
    return tile_board;
    
})();
