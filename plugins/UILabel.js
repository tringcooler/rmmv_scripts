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
    
    return ui_label;
    
})(Window_Base);
