Zepto($.fn.empty = function(){
  return this.each(function(){ this.innerHTML = '' })
}
)