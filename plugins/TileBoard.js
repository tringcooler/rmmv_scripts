
var tile_board = (function() {
    
    var TYPA = {
        none: 0x00,
        land: 0x04,
        wall: 0x08,
        port: 0x10,
        cent: 0x80,
        msk_area: 0xff,
        msk_evnt: 0x7f00,
        warn: 0x8000,
    };
    
    var a2e = a => (a & TYPA.msk_evnt) / (TYPA.msk_area + 1);
    
    var AREA_LAYER = 5;
    
    function map_builder(map_info, map_strr, dyn_evs, ui_lab) {
        this._map_strr = map_strr;
        this._dyn_evs = dyn_evs;
        this._ui_lab = ui_lab;
        this._minfo = map_info;
        this._init_decorator();
    }
    
    map_builder.prototype._init_decorator = function() {
        this._decorators = [];
        for(var [tname, tinfo, tlayer] of this._minfo.tileset) {
            if(tinfo instanceof Array) {
                this._decorators.push([new tile_decorator(this._map_strr, ...tinfo), tlayer ? tlayer : 0]);
            }
        }
    };
    
    map_builder.prototype._decorate = function(rng) {
        for(var [dec, layer] of this._decorators) {
            dec.decorate(rng[0].concat(layer), rng[1]);
        }
    };
    
    var get_tiles_info = function(area, tileset) {
        var tiles_info = [...Array(AREA_LAYER)].map(v => 0);
        for(var [tname, tinfo, tlayer] of tileset) {
            tlayer = tlayer ? tlayer : 0;
            var tmsk = TYPA[tname];
            if(area & tmsk) {
                if(tinfo instanceof Array) {
                    tiles_info[tlayer] = tinfo[0];
                } else {
                    tiles_info[tlayer] = tinfo;
                }
            }
        }
        return tiles_info;
    };
    
    var get_event_info = function(area, events) {
        var ev_info = events[a2e(area)];
        if(!ev_info) return [null];
        return ev_info;
    };
    
    var event_label_text = function(area, events) {
        var lbtag = 'prv_label';
        var [src_evid, ssw_id, init_pool] = get_event_info(area, events);
        if(!init_pool || !init_pool[lbtag]) return null;
        var evs = pool_util.evstr([lbtag], init_pool);
        if(!evs) return null;
        return evs();
    };
    
    map_builder.prototype._new_event = function(pos, area, events) {
        var [src_evid, ssw_id, init_pool] = get_event_info(area, events);
        if(src_evid === null) return null;
        var dst_evid = this._dyn_evs.clone_event(src_evid, pos[0], pos[1]);
        this._dyn_evs.refresh_events();
        if(ssw_id) {
            for(var sid of ssw_id) {
                plugin_util.evsw(dst_evid, sid, true);
            }
        }
        if(init_pool) {
            for(var k in init_pool) {
                if(!init_pool.hasOwnProperty(k)) continue;
                this._dyn_evs.epool(dst_evid)[k] = init_pool[k];
            }
        }
        return dst_evid;
    };
    
    var rng_each = function(rng, cb) {
        var [[left, top], [width, height]] = rng;
        for(var x = left; x < left + width; x ++) {
            for(var y = top; y < top + height; y ++) {
                if(cb(x, y) === false) break;
            }
        }
    };
    
    map_builder.prototype.build = function(rng) {
        rng_each(rng, (tx, ty) => {
            var area = this._map_strr.get_tile(tx, ty, AREA_LAYER);
            var tinfo = get_tiles_info(area, this._minfo.tileset);
            for(var tlayer = 0; tlayer < tinfo.length; tlayer ++) {
                var tval = tinfo[tlayer];
                if(tval || tlayer > 0) {
                    this._map_strr.set_tile(tx, ty, tlayer, tval);
                }
            }
            if(this._new_event([tx, ty], area, this._minfo.events) !== null) {
                this._map_strr.set_tile(tx, ty, AREA_LAYER, area & ~TYPA.msk_evnt);
            }
        });
        this._decorate(rng);
        this._ui_lab.bind_ev();
    };
    
    map_builder.prototype._prv_evlabel = function(pos, area, events, clean) {
        var text = event_label_text(area, events);
        if(text === null) return null;
        var key = 'prv:' + pos.join(',');
        if(clean) {
            this._ui_lab.remove(key);
        } else {
            this._ui_lab.label_ex(key, text, 'map', {pos: [pos], anchors: [[0.5, 0.5], [0.5, 0.5]]});
        }
        return key;
    };
    
    var secret_area = function(area, events) {
        var lb_text = event_label_text(area, events);
        if(typeof lb_text != 'string') return [false, area];
        var [sec_tag, sec_area] = lb_text.split(':');
        if(sec_tag != '@secret' || TYPA[sec_area] === undefined) return [false, area];
        return [true, TYPA[sec_area]];
    };
    
    map_builder.prototype.preview = function(prv_pool, clean = false) {
        var valid = true;
        prv_pool.each((tx, ty, area) => {
            var [sec, area] = secret_area(area, this._minfo.events);
            var tinfo = get_tiles_info(area, this._minfo.prvset);
            for(var tlayer = 0; tlayer < tinfo.length; tlayer ++) {
                var tval = tinfo[tlayer];
                if(tval) {
                    this._map_strr.set_tile(tx, ty, tlayer, clean ? 0 : tval);
                    if(tval == this._minfo.prvwarn) {
                        valid = false;
                    }
                }
            }
            if(!sec) {
                this._prv_evlabel([tx, ty], area, this._minfo.events, clean);
            }
        });
        this._map_strr.refresh_map();
        return valid;
    };
    
    var map_pool_util = {
        get: (pos, map) => map.get_tile(pos[0], pos[1], AREA_LAYER),
        set: (pos, map, val) => map.set_tile(pos[0], pos[1], AREA_LAYER, val),
        each: (map, cb) => map.layer_each(5, cb),
    };
    
    var tile_map = tile_maker.map;
    var tile_deck = tile_maker.deck;
    
    function tile_board(board_info, map_strr, dyn_evs, ui_lab) {
        this._store = new store_pool('tile_board');
        this._map = new tile_map([map_strr, map_pool_util]);
        this._binfo = board_info;
        this._builder = new map_builder(this._binfo.map, map_strr, dyn_evs, ui_lab);
        this._hook_plugin();
        this._store.load.on(this.init_deck.bind(this));
    }
    
    tile_board.prototype._panic = function() {
        throw Error('TileBoard Panic');
    };
    
    tile_board.prototype.init_deck = function(mapid) {
        this._deck = new tile_deck(this._binfo.deck.seed);
        var deck_pool = [];
        if(this._store.get('mapid') == mapid) {
            deck_pool = this._store.get('deck_pool');
            this._deck.restore(deck_pool);
        } else {
            this._deck.restore(deck_pool);
            this._deck.set_units(this._binfo.deck.units);
            if(this._deck.make_tiles() === null) this._panic();
            if(this._deck.fill_events(this._binfo.deck.events) === null) this._panic();
            this._store.set('deck_pool', deck_pool);
            this._store.set('mapid', mapid);
        }
    };
    
    tile_board.prototype.preview_on = function(pos, dpos) {
        var tile = this._deck.peek_tile();
        if(!tile) return null;
        var dst_pos = this._map.tile_pos(pos, dpos, tile);
        if(!dst_pos) return null;
        var prv_pool = this._map.preview_tile(dst_pos, tile);
        this._prv_info = {
            pos: dst_pos,
            pool: prv_pool,
            valid: this._builder.preview(prv_pool, false),
        };
    };
    
    tile_board.prototype.preview_off = function() {
        if(this._prv_info) {
            this._builder.preview(this._prv_info.pool, true);
        }
        this._prv_info = null;
    };
    
    tile_board.prototype.put_tile = function() {
        if(!this._prv_info) return null;
        var pos = this._prv_info.pos;
        var valid = this._prv_info.valid;
        this.preview_off();
        if(!valid) return null;
        var tile = this._deck.draw_tile();
        if(!tile) return null;
        this._map.put_tile(pos, tile);
        this._builder.build(tile.range(pos));
    };
    
    tile_board.prototype.break_wall = function(pos) {
        if(this._map.break_wall(pos) === null) return null;
        this._builder.build([[pos[0] - 1, pos[1] - 1], [3, 3]]);
    };
    
    tile_board.prototype._hook_plugin = function() {
        plugin_util.hook((command, args, interp) => {
            if(command == 'tile_board') {
                var ga = () => plugin_util.gval(args.shift());
                var cmd = ga();
                if(cmd == 'prv') {
                    if(args[0] == 'off') {
                        this.preview_off();
                    } else {
                        var pos = [0, 0].map(ga);
                        var dpos = [0, 0].map(ga);
                        this.preview_on(pos, dpos);
                    }
                } else if(cmd == 'put') {
                    this.put_tile();
                } else if(cmd == 'brk') {
                    var pos = [0, 0].map(ga);
                    this.break_wall(pos);
                } else if(cmd == 'num') {
                    plugin_util.sval(plugin_util.gval(args.shift()), this._deck.tiles_num());
                }
            }
        });
    };
    
    return tile_board;
    
})();

var g_t_board = new tile_board({
    deck: {
        seed: null,//123,
        units: [30, 15, 10, 5],
        events: [{
            0x10:5, 0x11: 5, 0x12:10, 0x13:5, 0x14:2, 0x15:1,
        }, {
            _start: 37, 0x21: 1,
        }, {
            _start: 18, 0x22: 1,
        }, {
            _start: 0, 0x18: 1,
        }],
    },
    map: {
        tileset: [
            ['none', [2432, 48, 3]],
            ['land', [2816, 48, 1]],
            ['port', [4256, 48, 1], 1],
            ['wall', [2432, 48, 3]],
            ['wall', 0, 1],
            ['cent', [2912, 48, 1]],
        ],
        prvset: [
            ['land', 48, 3],
            ['wall', 51, 3],
            ['cent', 52, 3],
            ['warn', 50, 3],
        ],
        prvwarn: 50,
        events: (function() {
            var ev_p = v => ({
                mhp: v,
                hp: v,
                exp: v,
                prv_label: "@ev:'mon:' + $.mhp",
                '@ui_label': "@ev:$.hp + '/' + $.mhp",
            });
            var a = (s, d) => Object.assign({}, s, d);
            return {
                0x10: [5, 'c', {'prv_label': 'atk'}],
                0x11: [5, 'd', ev_p(1)],
                0x12: [5, 'd', ev_p(2)],
                0x13: [5, 'd', ev_p(3)],
                0x14: [5, 'd', ev_p(4)],
                0x15: [5, 'd', ev_p(5)],
                0x16: [5, 'd', ev_p(6)],
                0x17: [5, 'd', ev_p(7)],
                0x18: [6, 'a', a(ev_p(8), {prv_label: '???'})],
                
                0x21: [9, 'a', {'prv_label': '???'}],
                0x22: [10, 'a', {'prv_label': '???'}],
            };
        })(),
    },
}, g_map_s, g_d_ev, g_ui_label);
