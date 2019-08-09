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
        g_map_s, {
            get: (pos, map) => map.get_tile(pos[0], pos[1], 5),
            set: (pos, map, val) => map.get_tile(pos[0], pos[1], 5, val),
            each: (map, cb) => map.layer_each(5, cb),
        },
    ];
    
    function tile_board(board_info) {
        this._store = new store_pool('tile_board');
        this._map = new tile_map(map_pool_hook);
        this._binfo = board_info;
        this._init_deck();
    }
    
    tile_board.prototype._panic = function() {
        throw Error('TileBoard Panic');
    };
    
    var mapid = function() {
        return $gameMap.mapId();
    };
    
    tile_board.prototype._init_deck = function() {
        this._deck = new tile_deck(this._binfo.seed);
        var deck_pool = [];
        if(this._store.get('mapid') == mapid()) {
            deck_pool = this._store.get('deck_pool');
            this._deck.restore(deck_pool);
        } else {
            this._deck.restore(deck_pool);
            this._deck.set_units(this._binfo.units);
            if(this._deck.make_tiles() === null) this._panic();
            if(this._deck.fill_events(this._binfo.events) === null) this._panic();
            this._store.set('deck_pool', deck_pool);
            this._store.set('mapid', mapid());
        }
    };
    
    tile_board.prototype.preview_on = function(pos, dpos) {
        // TODO: peek tile
    };
    
    tile_board.prototype.put_tile_on = function(pos, dpos) {
    };
    
    testf = function() {
    };
    
    return tile_board;
    
})();
