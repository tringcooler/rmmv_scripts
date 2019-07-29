
var tile_decorator = (function() {
    
    /*var cell2num = c => c.reduce((r, v, i) => r + (v << i), 0);
    var num2cell = n => {
        var cell = [];
        while(n) {
            cell.push(n % 2);
            n >>= 1;
        }
        return cell;
    };*/
    
    var cell2num = c => parseInt(c.map(v => v ? 1 : 0).join(''), 2);
    var num2cell = n => n.toString(2).split('').map(v => v == '1');
    var chk_vnum = n => {
        var vnum_msks = [
            [1 << 4, 1 << 4 | 1 << 3 | 1 << 0],
            [1 << 5, 1 << 5 | 1 << 0 | 1 << 1],
            [1 << 6, 1 << 6 | 1 << 1 | 1 << 2],
            [1 << 7, 1 << 7 | 1 << 2 | 1 << 3],
        ];
        for(var [e, msk] of vnum_msks) {
            if(!(n & e)) continue;
            if((n & msk) != msk) {
                return false;
            }
        }
        return true;
    };
    var SEQ_TILE_TYPES = [...Array((1 << 8) - 1).keys()].filter(n => chk_vnum(n));
    
})();
