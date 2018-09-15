$(function(){
	var index=1;
	var img = $('.lunbo');
	var width = $('body').width();
	var animateMove = function(){
		img.animate({
			'transform':'translate('+index*width*-1+'px)'  
		},300,'ease',function(){
			if(index>=4){
				index=1;
				img.css({'transition':'none','transform':'translate('+index*width*-1+'px)'  });
			}else if(index<=0){
                index=4;
                img.css({'transition':'none','transform':'translate('+index*width*-1+'px)'  });
			}
		});
	};
	var time01 = setInterval(function(){
		index++;
		animateMove();
	},1000);
  // 热门
   $('#rm').on('tap',function(){
          $('.content').children().remove();
          $.ajax({
            url:'articleServlet',
            type:'GET',
            dataType:'json',
            data:{'op':'doshowbycollectnum'},
            success:function(data){
                  console.log(data);
                  $.each(data,function(index,value){
                    var result = template('article',value);
                    // $(result).prependto($'.content');
                    $('.content').append(result);
            },
            error: function(){
            alert("发生未知错误");
            }
        }) 
       }) 
  // 起始刷新
  var aj=function(){
    $.ajax({
        url:'articleServlet',
        type:'GET',
        dataType:'json',
        data:{'op':'doshowArticles'},
        success:function(data){
          console.log(data);
          $.each(data,function(index,value){
                    var result = template('article',value);
                    // $(result).prependto($'.content');
                    $('.content').append(result);
          })                 
           test(); 
        
          },
        error: function(){
               alert("发生未知错误");
            }
      })
  }
  // aj();
   
         // 推荐
    $('#tj').on('tap',function(){
          $('.content').children().remove();
          $.ajax({
            url:'articleServlet',
            type:'GET',
            dataType:'json',
            data:{'op':'doshowbylikenum'},
            success:function(data){
                $.each(data,function(index,value){
                    var result = template('article',value);
                    $('.content').append(result);
                })
               test();   
            },
            error: function(){
               alert("发生未知错误");
            }
        })    
   })
    $('#gz').on('tap',function(){
          $('.content').children().remove();
          $.ajax({
            url:'articleServlet',
            type:'GET',
            dataType:'json',
            data:{'op':'doadd'},
            success:function(data){
                $.each(data,function(index,value){
                    var result = template('article',value);
                    $('.content').append(result);
                })
               test();   
            },
            error: function(){
               alert("发生未知错误");
            }
        })    
   })
  // 删除
  var test=function(){
      $('.xx').click(function(){
      $(this).parent().parent().css("display","none");
      console.log(this);
    })
  }
  // 上拉加载
    
     var outer = document.querySelector('.content');
    var touchStart = 0;
    var touchDis = 0;

    outer.addEventListener('touchstart', function(event) {
        var touch = event.targetTouches[0];
        // 把元素放在手指所在的位置
        touchStart = touch.pageY;
        console.log(touchStart);
    }, false);
    outer.addEventListener('touchmove', function(event) {
        var touch = event.targetTouches[0];
        var value = touch.pageY-touchStart+'px';
        $('.content').css("padding-top",value);
 
        touchDis = touch.pageY-touchStart;
    }, false);
    outer.addEventListener('touchend', function(event) {
        // touchStart = 0;
        var touch=event.changedTouches[0]; 
         // console.log(touchStart);
         // console.log(touch.pageY);
        var top = touch.pageY-touchStart;
        // console.log(top);
        
        if(top>60) {
          
          $('.content').children().remove();aj();
          $('.content').css("padding-top","0.1rem"); 
        }
        if(top>0){
            
                $('.content').css("padding-top","0.1rem");
                
        }
    }, false);



    $('.wyb').click(function(){
      location.href='cz_PasswordLogin.html';
    })

})