var tile_board = (function() {
    
    var TYPA = {
        none: 0x00,
        land: 0x04,
        wall: 0x08,
        port: 0x10,
        cent: 0x80,
        msk_area: 0xff,
        msk_evnt: 0x7f00,
    };
    
    var a2e = a => (a & TYPA.msk_evnt) / (TYPA.msk_area + 1);
    
    function map_builder(map_info, map_strr) {
        this._map_strr = map_strr;
        this._minfo = map;
    }
    
    map_builder.prototype._init_decorator = function() {
        this._decorators = [];
        for(var [tname, tinfo] in this._minfo.tileset.base) {
            if(tinfo instanceof Array) {
                this._decorators.push(new tile_decorator(this._map_strr, ...tinfo));
            }
        }
    };
    
    map_builder.prototype._decorate = function(rng) {
        for(var dec of this._decorators) {
            dec.decorate(...rng);
        }
    };
    
    map_builder.prototype._get_tileset_base = function(area) {
        for(var [tname, tinfo] in this._minfo.tileset.base) {
            var tmsk = TYPA.tname;
            if(area & tmsk) {
                if(tinfo instanceof Array) {
                    return tinfo[0];
                } else {
                    return tinfo;
                }
            }
        }
        return null;
    };
    
    map_builder.prototype.build = function(rng) {
    };
    
    map_builder.prototype.preview = function(rng) {
    };
    
    var map_pool_util = {
        get: (pos, map) => map.get_tile(pos[0], pos[1], 5),
        set: (pos, map, val) => map.get_tile(pos[0], pos[1], 5, val),
        each: (map, cb) => map.layer_each(5, cb),
    };
    
    var tile_map = tile_maker.map;
    var tile_deck = tile_maker.deck;
    
    function tile_board(board_info, map_strr) {
        this._store = new store_pool('tile_board');
        this._map = new tile_map([map_strr, map_pool_util]);
        this._binfo = board_info;
        this._builder = new map_builder(this._binfo.map, map_strr);
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
        var tile = this._deck.peek_tile();
        if(!tile) return null;
        var dst_pos = this._map.tile_pos(pos, dpos, tile);
        if(!dst_pos) return null;
        var prv_apool = this._map.preview_tile(dst_pos, tile);
        //TODO: show preview
    };
    
    tile_board.prototype.put_tile_on = function(pos, dpos) {
        var tile = this._deck.peek_tile();
        if(!tile) return null;
        this._map.put_tile(pos, dpos, tile);
        //TODO: draw map
    };
    
    testf = function() {
    };
    
    return tile_board;
    
})();

var g_t_board = new tile_board({
    seed: 123,
    units: [30, 15, 10, 5],
    events: {
        0x11: 5, 0x12:10, 0x13:5, 0x14:2, 0x15:1,
    },
    map: {
        tileset: {
            base: [
                ['cent', [4000, 48, 1]],
                ['wall', 3000],
                ['land', [2000, 48, 1]],
                ['none', [1000, 48, 3]],
            ],
            deco: [
                ['port', [5000, 1]],
            ],
        }
    },
}, g_map_s);
