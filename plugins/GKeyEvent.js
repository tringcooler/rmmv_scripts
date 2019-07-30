
var gkey_event = (function() {
    
    function gkey_event(area_id, dir_foot = true, dir_face = false) {
        this._area = area_id;
        this._t_dir = [dir_foot, dir_face];
    }
    
    
    
    return gkey_event;
    
})();
