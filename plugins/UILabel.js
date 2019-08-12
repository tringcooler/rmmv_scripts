var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    d.prototype = Object.create(b.prototype);
    d.prototype.constructor = d;
};

var __supermethod = this.__supermethod || function (_spr, _slf, mth) {
    if(_spr.prototype[mth]) {
        return _spr.prototype[mth].bind(_slf);
    } else {
        return function() {};
    }
};

var ui_label = (function(_super) {
    
    __extends(ui_label, _super);
    function ui_label(text, pos) {
        _super.call(this, 0, 0, 0, 0);
        this.set_text(text);
    }
    
    ui_label.prototype.set_text = function(text) {
        if(!text) return;
        var padding = this.standardPadding() * 2;
        this.width = this.textWidth(text.split('\n')[0]) + padding;
        this.height = this.calcTextHeight({text: text}, true) + padding;
        this._label_text = text;
        this.createContents();
    };
    
    ui_label.prototype.set_pos = function(pos) {
        if(!pos) return;
        this.x = pos[0] || 0;
        this.y = pos[1] || 0;
    };
    
    ui_label.prototype.update = function() {
        __supermethod(_super, this, 'update')();
        this.refresh();
    };
    
    ui_label.prototype.refresh = function() {
        this.drawTextEx(this._label_text, 0, 0);
    };
    
    ui_label.prototype.bind = function(parent) {
        if(!parent) return;
        this.remove();
        parent.addChild(this);
    };
    
    ui_label.prototype.remove = function() {
        return this.parent && this.parent.removeChild(this);
    };
    
    return ui_label;
    
})(Window_Base);

var ui_label_map = (function(_super) {
    
    __extends(ui_label_map, _super);
    function ui_label_map(...args) {
        _super.call(this, ...args);
        this.set_anchors([0.5, 1], [0.5, 0]);
        this.set_map_pos([0, 0]);
    }
    
    var cscene = () => (sc => (sc instanceof Scene_Map) ? sc : null)(SceneManager._scene);
    var g_map = () => $gameMap;
    
    ui_label_map.prototype.bind = function() {
        var sc = cscene();
        if(sc) {
            this.remove();
            sc.addWindow(this);
        }
    };
    
    ui_label_map.prototype.set_anchors = function(s_anchor, d_anchor) {
        if(s_anchor) {
            this._s_anchor = s_anchor;
        }
        if(d_anchor) {
            this._d_anchor = d_anchor;
        }
    };
    
    ui_label_map.prototype.screen_pos = function(pos) {
        return [
            (g_map().adjustX(pos[0]) + this._d_anchor[0]) * $gameMap.tileWidth() - this.width * this._s_anchor[0],
            (g_map().adjustY(pos[1]) + this._d_anchor[1]) * $gameMap.tileHeight() - this.height * this._s_anchor[1],
        ];
    };
    
    ui_label_map.prototype.set_map_pos = function(pos) {
        if(pos) {
            this._map_pos = pos;
        }
        this.set_pos(this.screen_pos(this._map_pos));
    };
    
    ui_label_map.prototype.refresh = function() {
        this.set_map_pos();
        __supermethod(_super, this, 'refresh')();
    };
    
    return ui_label_map;
    
})(ui_label);
