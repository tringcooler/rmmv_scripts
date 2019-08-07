
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
            this._code = code;
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
                    if((x + y) % 2) {
                        this._apool.set([x, y], TYPA.supp_e);
                    } else {
                        this._apool.set([x, y], TYPA.supp_c);
                    }
                }
            }
            this._apool.set([0, 0], TYPA.land);
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
        
        dye_chain.prototype.is_conn = function(dst) {
            return this.base() === dst.base();
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
            this._trace = [];
        }
        
        tile_inner.prototype._ginfo = function(pos) {
            return pool_util.get(pos, this._cpool);
        };
        
        tile_inner.prototype._dye = function(pos) {
            var valid = true;
            var invalid_walls = {
                every: [],
                some: [],
            };
            var sinfo = this._ginfo(pos);
            if(!sinfo) return;
            var [scode, sdc] = sinfo;
            for(var dir = 0; dir < 4; dir++) {
                var wm = 1 << dir;
                var rwm = 1 << ((dir + 2) % 4);
                var sconn = !(scode & wm);
                var dpos = posadd(pos, c_wall_msk2pos[wm]);
                var dinfo = this._ginfo(dpos);
                if(!dinfo) {
                    if(sconn) {
                        sdc.val().conn += 1;
                    } else {
                        invalid_walls.some.push(wm);
                    }
                    continue;
                }
                var [dcode, ddc] = dinfo;
                var dconn = !(dcode & rwm);
                var sdconn = sdc.is_conn(ddc);
                if(!sconn && dconn) {
                    ddc.val().conn -= 1;
                    if(!sdconn) {
                        if(ddc.val().conn <= 0) {
                            valid = false;
                            invalid_walls.every.push(wm);
                        } else {
                            invalid_walls.some.push(wm);
                        }
                    }
                } else if(sconn && dconn) {
                    if(sdconn) {
                        sdc.val().conn -= 1;
                    } else {
                        sdc.val().conn += ddc.val().conn - 1;
                        ddc.dye_by(sdc);
                    }
                }
            }
            if(sdc.val().conn <= 0) {
                valid = false;
                if(invalid_walls.some.length <= 0) {
                    invalid_walls.some = null
                }
            } else {
                invalid_walls.some = [];
            }
            return valid ? null : invalid_walls;
        };
        
        tile_inner.prototype.set_unit = function(pos, code) {
            this._trace.push([pos, code]);
            if(this._ginfo(pos)) return false;
            var dc = new dye_chain();
            dc.val({conn: 0});
            pool_util.set(pos, this._cpool, [code, dc]);
            return this._dye(pos);
        };
        
        tile_inner.prototype.reset = function(back = 0) {
            var trace = this._trace.slice(0, -back);
            this._trace = [];
            this._cpool = {};
            if(back === null) return;
            for(var [pos, code] of trace) {
                this.set_unit(pos, code);
            }
        };
        
        return tile_inner;
        
    })();
    
    var tile_deck = (function() {
        
        function tile_deck(rng) {
            this._upool = [];
            this._tpool = [];
            if(!rng) {
                rng = new mt_rng();
            }
            this._rng = rng;
        }
        
        var walls2types = [1, 4, 6, 4];
        
        var _uidx2code = [
            [0],
            [TYPC.wall[0], TYPC.wall[1], TYPC.wall[2], TYPC.wall[3]],
            [
                TYPC.wall[0] | TYPC.wall[1], TYPC.wall[1] | TYPC.wall[2],
                TYPC.wall[2] | TYPC.wall[3], TYPC.wall[3] | TYPC.wall[0],
                TYPC.wall[0] | TYPC.wall[2], TYPC.wall[1] | TYPC.wall[3],
            ],
            [
                TYPC.wall[0] | TYPC.wall[1] | TYPC.wall[2],
                TYPC.wall[1] | TYPC.wall[2] | TYPC.wall[3],
                TYPC.wall[2] | TYPC.wall[3] | TYPC.wall[0],
                TYPC.wall[3] | TYPC.wall[0] | TYPC.wall[1],
            ],
        ];
        var uidx2code = uidx => _uidx2code[uidx[0]][uidx[1]];
        
        var code2uidx = (() => {
            var r = {};
            for(var u0 = 0; u0 < _uidx2code.length; u0 ++) {
                for(var u1 = 0; u1 < _uidx2code[u0].length; u1 ++) {
                    r[_uidx2code[u0][u1]] = [u0, u1];
                }
            }
            return r;
        })();
        
        tile_deck.prototype._units_by_walls = function(unum, wnum) {
            var tnum = walls2types[wnum];
            var pnum = Math.floor(unum / tnum);
            var dnum = unum - pnum * tnum;
            var rnums = [...Array(tnum)].map((v, i) => i < dnum ? pnum + 1: pnum);
            return rnums;
        };
        
        tile_deck.prototype.set_units = function(unums) {
            for(var i = 0; i < unums.length; i++) {
                this._upool.push(this._units_by_walls(unums[i], i));
            }
        };
        
        tile_deck.prototype.take_unit = function(uidx) {
            if(this._upool[uidx[0]][uidx[1]] > 0) {
                this._upool[uidx[0]][uidx[1]] --;
                return true;
            } else {
                return false;
            }
        };
        
        tile_deck.prototype.peek_unit = function(uidx) {
            if(this._upool[uidx[0]] && this._upool[uidx[0]][uidx[1]] > 0) {
                return this._upool[uidx[0]][uidx[1]];
            } else {
                return 0;
            }
        };
        
        tile_deck.prototype.put_unit = function(uidx) {
            if(this._upool[uidx[0]] && this._upool[uidx[0]][uidx[1]] >= 0) {
                this._upool[uidx[0]][uidx[1]] ++;
            }
        };
        
        tile_deck.prototype._unit_num = function() {
            return this._upool.reduce((r, p) => r + p.reduce((r, v) => r + v), 0);
        };
        
        tile_deck.prototype._nidx2uidx = function(nidx) {
            var idx = 0;
            for(var i = 0; i < this._upool.length; i++) {
                for(var j = 0; j < this._upool[i].length; j++) {
                    var num = this._upool[i][j];
                    if(idx + num > nidx) {
                        return [i, j, nidx - idx];
                    }
                    idx += num;
                }
            }
            return null;
        };
        
        tile_deck.prototype.rand_unit = function() {
            var unum = this._unit_num();
            if(unum <= 0) return null;
            var nidx = this._rng.randint(unum - 1);
            var uidx = this._nidx2uidx(nidx);
            return [uidx[0], uidx[1]];
        };
        
        tile_deck.prototype._demote_seq = function(uidx) {
            var seq = [];
            for(var i = 0; i < uidx[0]; i++) {
                seq = this._upool[i].map((v, i2) => [i, i2]).concat(seq);
            }
            seq = this._upool[uidx[0]].filter((v, i) => i != uidx[1]).map((v, i) => [uidx[0], i]).concat(seq);
            return seq;
        };
        
        var _cent_rng = seq_len => (neg => [-neg, seq_len - neg])(Math.floor((seq_len - 1) / 2));
        var tseq2pos = function(tseq) {
            var pos_seq = [];
            var [ys, ye] = _cent_rng(tseq.length);
            for(var y = ys; y < ye; y++) {
                var [xs, xe] = _cent_rng(tseq[y - ys].length);
                for(var x = xs; x < xe; x++) {
                    if(tseq[y - ys][x - xs]) {
                        pos_seq.push([x, y]);
                    }
                }
            }
            return pos_seq;
        };
        
        var tcode2tseq = function(tcode) {
            return tcode.split(',').map(s => s.split('').map(v => parseInt(v)));
        };
        
        var _cache_tcode = {};
        var tcode2pos = function(tcode) {
            if(!_cache_tcode[tcode2pos]) {
                _cache_tcode[tcode2pos] = tseq2pos(tcode2tseq(tcode));
            }
            return _cache_tcode[tcode2pos];
        };
        
        var some_chooser = function*(some_bits, num) {
            if(num == 0 || !some_bits) {
                if(num == 0) {
                    yield 0;
                }
                return;
            }
            var _seq = some_bits;
            var _msk = 1;
            while(_seq) {
                var _b = (_seq & _msk);
                _seq &= ~_msk;
                _msk <<= 1;
                if(!_b) continue;
                var nxt_bits = (some_bits & (_b - 1));
                for(var nxt_ch of some_chooser(nxt_bits, num - 1)) {
                    yield nxt_ch | _b;
                }
            }
        };
        
        var any_bit = function(some_bits) {
            for(var b of some_chooser(some_bits, 1)) {
                return b;
            }
            return 0;
        };
        
        tile_deck.prototype._demote_tile_unit = function(src_cw, some_w, cnum = 1) {
            if(!some_w && this.peek_unit(code2uidx[src_cw]) > 0) {
                return src_cw;
            }
            var dst_unum = -1;
            var dst_cw = 0;
            var dst_w = 0;
            for(var ch_w of some_chooser(some_w, cnum)) {
                var _dw = (src_cw & ~ch_w);
                var _unum = this.peek_unit(code2uidx[_dw]);
                if(_unum > dst_unum) {
                    dst_unum = _unum;
                    dst_cw = _dw;
                    dst_w = ch_w;
                }
            }
            if(dst_unum < 0) {
                return null;
            } else if(dst_unum == 0) {
                return this._demote_tile_unit(src_cw, some_w, cnum + 1);
            }
            return dst_cw;
        };
        
        var pad_unit_code = () => 0;
        tile_deck.prototype._set_tile_unit_to_tile = function(pos, uidx, tu_seq, ti) {
            var cw;
            if(this.take_unit(uidx)) {
                cw = uidx2code(uidx);
            } else {
                cw = pad_unit_code();
            }
            var inv_info = ti.set_unit(pos, cw);
            if(inv_info) {
                if(!inv_info.some) {
                    return false;
                }
                var some_w = inv_info.some.reduce((r, w) => r | w, 0);
                var every_w = inv_info.every.reduce((r, w) => r | w, 0);
                var demote_cw = this._demote_tile_unit(cw & ~every_w, some_w);
                if(demote_cw === null) {
                    var split_cw = (any_bit(some_w) | every_w);
                    demote_cw = (cw & ~split_cw);
                    this.put_unit(code2uidx[split_cw]);
                    this.put_unit(code2uidx[demote_cw]);
                } else {
                    this.put_unit(uidx);
                }
                ti.reset(1);
                return this._set_tile_unit_to_tile(pos, code2uidx[demote_cw], tu_seq, ti);
            } else {
                tu_seq.push(cw);
            }
            return true;
        };
        
        tile_deck.prototype._cancel_tile = function(tu_seq) {
            for(var uidx of tu_seq) {
                this.put_unit(uidx);
            }
        };
        
        tile_deck.prototype.make_tile = function(tcode) {
            var pos_seq = tcode2pos(tcode);
            var tu_seq = [];
            var ti = new tile_inner();
            for(var pos of pos_seq) {
                var uidx = this.rand_unit();
                //TODO
            }
        };
        
        return tile_deck;
        
    })();

    var tile_map = (function() {
        
        function tile_map() {
            this._apool = new area_pool();
        }
        
        return tile_map;
        
    })();
    
    testf = function() {
        var td = new tile_deck();
        var r;
        //td.set_units([30, 15, 10, 5]);
        //td.set_units([30, 0, 6, 4]);
        td.set_units([30, 15, 6, 4]);
        var tu_seq = [];
        var ti = new tile_inner();
        td._set_tile_unit_to_tile([0, -1], code2uidx[0x7], tu_seq, ti);
        td._set_tile_unit_to_tile([1, 0], code2uidx[0xe], tu_seq, ti);
        /*console.log(tu_seq);
        td._set_tile_unit_to_tile([0, 0], code2uidx[0xd], tu_seq, ti);
        console.log(tu_seq);*/
        td._set_tile_unit_to_tile([0, 1], code2uidx[0xd], tu_seq, ti);
        r = td._set_tile_unit_to_tile([-1, 0], code2uidx[0xb], tu_seq, ti);
        console.log(r, tu_seq);
        r = td._set_tile_unit_to_tile([0, 0], code2uidx[0], tu_seq, ti);
        console.log(r, tu_seq);
        return td;
    };

})();
