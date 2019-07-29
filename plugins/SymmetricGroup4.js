
var symmetric_group_4 = (function () {
    
    function symm4(init_act = [1, 2, 3, 4]) {
        this._action = init_act.slice();
        this._generators = [
            //[[1, 2, 4, 3]],
            //[[2, 3, 4]],
            [[1, 2, 3, 4]],
            [[3, 1, 2, 4]],
        ];
    }
    
    var v2i = v => v - 1;
    var aget = (a, i) => ((a, i) => a[i < 0 ? i + a.length : i])(a, i % a.length);
    
    symm4.prototype._perm1 = function(p) {
        var _ta = {};
        for(var i = 0; i < p.length; i++) {
            _ta[v2i(aget(p, i))] = this._action[v2i(aget(p, i + 1))];
        }
        for(var i = 0; i < this._action.length; i++) {
            if(!(i in _ta)) continue;
            this._action[i] = _ta[i];
        }
    };
    
    symm4.prototype.perm = function(parr) {
        for(var p of parr) {
            this._perm1(p);
        }
    };
    
    symm4.prototype.action = function() {
        return this._action;
    };
    
    symm4.prototype.go = function(n) {
        var gen = this._generators[n];
        this.perm(gen);
    };
    
    var rndint = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
    
    symm4.prototype.shuffle = function() {
        var cnt = rndint(15, 50);
        for(var i = 0; i < cnt; i++) {
            var dir = rndint(0, 1);
            this.go(dir);
        }
    };
    
    return symm4;
    
})();

(function() {
    
    var gval = id =>  $gameVariables.value(parseInt(id));
    var sval = (id, val) => $gameVariables.setValue(parseInt(id), parseInt(val));

    var _o_plg_cmd = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _o_plg_cmd.call(this, command, args);
        if(command == 's4go') {
            var dir = parseInt(args.shift());
            var id4 = args.slice(0, 4);
            var v4 = id4.map(i => gval(i));
            var s4 = new symmetric_group_4(v4);
            s4.go(dir);
            for(var i = 0; i < id4.length; i++) {
                sval(id4[i], s4.action()[i]);
            }
        } else if(command == 's4shuffle') {
            var id4 = args.slice(0, 4);
            var v4 = id4.map(i => gval(i));
            var s4 = new symmetric_group_4(v4);
            s4.shuffle();
            for(var i = 0; i < id4.length; i++) {
                sval(id4[i], s4.action()[i]);
            }
        }
        
    };
    
})();
