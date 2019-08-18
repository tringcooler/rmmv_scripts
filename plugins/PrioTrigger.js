
var prio_trigger = (function() {
    
    function prio_trigger() {
    }
    
    prio_trigger.prototype._hook_ev_condi = function() {
        var _o_ev_mt_condi = Game_Event.prototype.meetsConditions;
        var self = this;
        Game_Event.prototype.meetsConditions = function(page) {
            if(!_o_ev_mt_condi.call(this, page)) return false;
            
            
        };
    };
    
    prio_trigger.prototype._hook_map_refresh = function() {
        var _o_map_refresh = Game_Map.prototype.refresh;
        var self = this;
        Game_Map.prototype.refresh = function(page) {
            _o_map_refresh.call(this);
            
            
        };
    };
    
    return prio_trigger;
    
})();
