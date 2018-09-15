  var aj=function(){
    $.ajax({
        url:'articleServlet',
        type:'GET',
        dataType:'json',
        data:{'op':'doshowArticles',
        	'userID':1},
        success:function(data){
           len=data.length;
           console.log(data);

          $.each(data,function(index,value){  
                    var result = template('article',value.article);
                    $('.content').append(result);
                    $('.bl1').eq(index).text(value.like);
                    $('.bl2').eq(index).text(value.collect);
                    var  m=$('.mgb').eq(index);
                    
//                    console.log(m);
                    var b = $('.bl2').eq(index).text();
                    console.log(b=='true');
                    if(b=='true'){

                    	m.attr('src','imgs/wyb_x1_2.png');
                    }else{

                    	m.attr('src','imgs/wyb_x1_1.png');
                    }
          })      

       
                    
           test(); 

          },
        error: function(){
               alert("发生未知错误");
            }
      })
  }
  aj();
  var ab=function(){
    $.ajax({
        url:'my.json',
        type:'GET',
        dataType:'json',
        data:{'op':'doshowArticles'},
        success:function(data){
          console.log(data);
          console.log(len);

          $.each(data,function(index,value){
              if(data.index>=len){
                    var result = template('article',value);
                    // $(result).prependto($'.content');
                    $('.content').append(result);
                    console.log(data.like);
                    $('.bl1').eq(index).text(data.like);
                    $('.bl2').eq(index).text(data.collect);

                    
                  }
          }) 
          len=data.length;
          // console.log(data.data.length); 
          console.log(len);             
           test(); 
        
          },
        error: function(){
               alert("发生未知错误");
            }
      })
  }
   var test=function(){
      $('.xx').click(function(){
      $(this).parent().parent().css("display","none");
      console.log(this);
    })
      $('.zan').click(function(){
        var b=$(this).children('span');
        var that=$(this).parent().parent();
        var bool=that.find('.bl1').text();
        console.log(bool);
        var articleID=that.find('.aID').text();
        var val=b.text();
        if(bool=='false'){ 
          val++;
          b.text(val);
          console.log(val);
        $.ajax({
          url:'articleServlet',
          type:'GET',
          dataType:'json',
          data:{'op':'addlikenum','likenum':val,'userID':1,'articleid':articleID},
          success: function(data){ 
        	 console.log(data);
             alert("点赞成功");
             that.find('.bl1').text('true');
             b.text(val);
          },
           error: function(){
               alert("发生未知错误");
       }
     })
        }
        
     })      
   
      $('.quxiao').click(function(){
        var b=$(this).parent().find('#like');
        var that=$(this).parent().parent();
        var bool=that.find('.bl1').text();
        var articleID=that.find('.aID').text();
        console.log(bool);
        var val=b.text();
        console.log(b);
        if(bool=='true'){ 
          val--;
          console.log(val);
          $.ajax({
          url:'articleServlet',
          type:'GET',
          dataType:'json',
          data:{'op':'removelikenum','likenum':val,'userID':1,'articleid':articleID},
          success: function(data){
             alert("取消点赞成功");
             that.find('.bl1').text('false');
             b.text(val);
          },
         error: function(data){
               alert("发生未知错误");
       }
     })
        }
        // console.log(val);
        
  })
      $('.shoucang').click(function(){
        var b=$(this).children("span");
        var m=$(this).children('img');
        var that=$(this).parent().parent();
        var nu=that.find('.bl2');
        var num=nu.text();
        console.log(num);
        var articleID=that.find('.aID').text();
        console.log(m);
        console.log(b);
         var val=b.text();
         console.log(val);
         console.log(num);
         console.log(num=='true');
       if(num=='true'){
        val++;        
        b.text(val);
        $.ajax({
          url:'articleServlet',
          type:'GET',
          dataType:'json',
          data:{'op':'addcollect_num','collect_num':val,'userID':1,'articleid':articleID},
          success:function(data){
              alert("收藏成功");
             m.attr('src','imgs/wyb_x1_1.png');
             nu.text('false');
          },
         error: function(){
               alert("发生未知错误");
       }
        })
      }
      else{
        num="true";
        val--;
        b.text(val);
        // a=--val;
        // b.text(a);
        $.ajax({
          url:'articleServlet',
          type:'GET',
          dataType:'json',
          data:{'op':'removecollect_num','collect_num':val,'userID':1,'articleid':articleID},
          success:function(data){
        	  alert('取消收藏')
             m.attr('src','imgs/wyb_x1_2.png');
             nu.text('true');
          },
         error: function(){
               alert("发生未知错误");
       }
     })
       }
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
        // console.log(touchStart);
    }, false);
    outer.addEventListener('touchmove', function(event) {
        var touch = event.targetTouches[0];
        var value = touchStart-touch.pageY+'px';
        $('.content').css("margin-bottom",value);
 
        touchDis = touch.pageY-touchStart;
    }, false);
    outer.addEventListener('touchend', function(event) {
        // touchStart = 0;
        var touch=event.changedTouches[0]; 
         // console.log(touchStart);
         // console.log(touch.pageY);
        var top = touchStart-touch.pageY;
        // console.log(top);
        
        if(top>60) {        
          ab();
          $('.content').css("margin-bottom","0.1rem"); 
        }
        if(top>0){
            
                $('.content').css("margin-bottom","0.1rem");
                
        }
    }, false);

    $('.inp1').click(function(){
      location.href='question.html';
    })

