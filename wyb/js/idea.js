
$(function(){

     // alert('fdf')
     //热门更新
     $('#hot').addClass('fxx');
     $('#fx').click(function(){

              $('.content').hide();
              $('.content_a').show();
              $('#fx').addClass('fxx');
              $('#hot').removeClass('fxx');

     })
    $('#hot').click(function(){

              $('.content').show();
              $('.content_a').hide();
              $('#fx').removeClass('fxx');
              $('#hot').addClass('fxx');
    })

   //页面载入
  var that6 = $('#us').find('.uu');
    $.ajax({
            url:'../ideaServlet',
            type:'GET',
            dataType:'json',
            data:{
            	'op':'loadIdea',
            	'userID' : 1
            	}, 
            success:function(data){
//                 console.log(data.length);
//            	console.log(data[0]);
//            	console.log(data[0].idea.ideaID);
            	var id = data[0].idea.ideaID;
            	 
    
//            	console.log(data);
//            	console.log(data[0].idea);
//            	console.log(data[0].idea.list);
//            	 $('.push').append(data.list[0]);
                $.each(data,function(index,value){
//                  console.log(value.list);
//                	var arr=[];
//                	var a1=value.b;
//                	var a2=value.ideaBody;
//                	var a3=value.ideaID;
//                	var a4=value.likeNumber;
//                	var a5=value.;
//                	var a6=value.;
            
                    console.log(index);
                    console.log(value.list);
                    
//                      console.log(value.list[index]);
//                      $('.push').append(value.list);
                   
                    var result = template('article',value);
                   
                    $('#section').append(result);
                    $.each(value.list,function(a,b){
                    	console.log(b.commentBody);
                    	console.log($('.push').eq(index));
                    	var push1 = $('.push').eq(index);
                    	push1.append('<p>'+b.commentBody+'</p>').css({'background':'yellow'})
//                    	var haha = template('content',b);
////                    	 console.log(result);
////                    	 console.log( $('.push'):eq(0));
//                        $('.push').eq(index).append(haha);
                       
                    })
//                    $('.push').append(value.)
                     
//                    console.log(value.idea);
//                    for(value.idea.)
//                    var as = value.idea.user;
//                     console.log(as.name);
//                     let arr2 = Array.from(as.name);
//                     console.log(arr2);
//                     for (as.name in )

//                    	 $('#us').text(as.name);
                   
                    
//                    for (var va of value) {
//                    	console.log(va);
//                    }
                    
//                    $('.idd2').text(value);
//                    $('.r_1').text(value.age);
                })
              main();
            },
            error: function(){
            alert("发生未知错误");
            }
        })         

   //发现页面关注按钮

    var tre = true;
    $('.tx').css({'padding-right':'0.5rem','font-size':'0.5rem'});
    $('.tx').click(function(){
     var tx = $(".tx");
    
      
    if(tre){
            
           $(this).text('已关注').css('padding-right','0.5rem');
           tre = false;

           $.ajax({

                type:'GET',
                url:'../userServle',
                dataType:'json',
                data:{
                    
                      'attentUserID':tx.text(),
                      'userID':1,
                      'op':'attent'


                },
                success:function(data){
                 console.log(data); 
                 
           
                }
            })

    }else{
           
           $(this).text('+关注');
           tre = true;

           $.ajax({

                type:'GET',
                url:'../userServle',
                dataType:'json',
                data:{
                    
                             'attentUserID':tx.text(),
                             'userID':'1',
                             'op': 'removeAttent'


                },
                success:function(data){
                 console.log(data); 
                 
           
                }
            })
    }
    
    
    })

     //热门关注按钮
    // alert('dsd')
    var main = function(){

    var gz = $('.gz');
    var sa = true;
    var us = $('#us');  
    // console.log(us.val());       
    gz.click(function(){

        if(sa){
                    $(this).text('已关注').css('background','skyblue');
                    sa = false;

                    $.ajax({
                         type:'GET',
                         url:'../userServlet',
                         dataType:'json',
                         data:{
                    
                               'attentUserID':us.val(),
                               'userID':'1',
                               'op':'attent'
                         },
                         success:function(data){
                          console.log(data); 
                          
                         }
                         })
                    }else{
                    $(this).text('+关注').css('background','rgb(221, 221, 221)');
                    sa = true; 
                    $.ajax({
                       type:'GET',
                       url:'../userServlet',
                       dataType:'json',
                       data:{
                    
                             'attentUserID':us.val(),
                             'userID':'1',
                             'op': 'removeAttent' 

                       },
                       success:function(data){
                           
                           console.log(data); 
                           
                       }
                       })

                    }             
    
    })

    //文章删除按钮
    $('.dele').hide();

    $('.icon-dian').click(function(){
          // var de = $(this).parent().parent().parent().parent().next();
          // de.toggle();
          var move = $(this).parents('.content');
          move.remove();
          var that3 = $(this).parent().parent().parent().parent();
          
          var id3 = that3.find('.idd2');
          console.log(id3.text());
          $.ajax({
                type:'GET',
                url:'../ideaServlet',
                dataType:'json',
                data:{
                	 'ideaID':id3.text(),
                     'op':'removeIdea'
                },
                success:function(data){
                       console.log(data);           
                }
            })
           
    })
       
    
    // $('.sc').click(function(){
            
    //          var id1= $('.idd2').text();
    //          console.log(id1);

    //          var co = $(this).parent().next();
    //          co.remove();
             // $('.dele').remove();
            
            //   $.ajax({
            //     type:'GET',
            //     url:'../ideaServlet',
            //     dataType:'json',
            //     data:{
            //          'va':id1,
            //          'op':'removeIdea'
            //     },
            //     success:function(data){
            //            // console.log(data);           
            //     }
            // })
            
             
           
        

    // })



   // 发表想法的时间
  

    //留言
    var pinlun = $('.icon-pinglun');
    var textarea = $('#textarea');
    var send = $('.send'); 
    var content = $('.content');
     $('.comment').hide();
    pinlun.click(function(){
         $(this).parent().siblings('.comment').toggle();
    })
    
    send.click(function(){
    	
    	
    	
    	
    	  var that = $(this).parent().parent().parent();
    	  console.log(that);
    	  var id1=that.find('.idd2');
    	  
    	  console.log(id1);
    	  var push = $(this).parent().siblings('.push');   
             
            $('.comment').hide();
           if($(this).prev().val().length!=0){
        	   
        	   $.ajax({
                   type:'GET',
                   url:'../ideaServlet',
                   dataType:'json',
                   data:{
                     'message':textarea.val(),
                     'ideaID':id1.text(),
                     'userID':us.val(),
                     'op':'comment'
                      
                   },
                   success:function(data){
//                     console.log(data.idea.list.commentBody);
//                     console.log(data.idea.list.commentID)
//                   	console.log(data.idea)
                     

                   }
                })
        	   
        	   
                num=$(this).parent().siblings().children('.icon-pinglun').text();
                num++;
                $(this).parent().siblings().children('.icon-pinglun').text(num);
                push.append('<p>'+$(this).prev().val()+'</p>').css({'background':'yellow','border':'2px solid black'});
                $(this).prev().val('');
                
                
           }
//           console.log($('.idd2').text());
           console.log(id1.text());
           

    })
         
  //点赞数   
    var zan = $('.icon-qinziAPPtubiao-');
    var tr = true ;
    zan.click(function(){ 
    	var that4 = $(this);
    	
    // zan.addClass('iconfont').addClass('icon-dianzan1');
        var that1 = $(this).parent().parent().parent();
//      console.log(that1);
        var id2 = that1.find('.idd2');
//      console.log(id2);
//      console.log(id2.text())
        var that5 = $(this).parent().parent().find("#uu");
        console.log(that5.text());
        if(tr){

            
            $(this).removeClass();
            $(this).addClass('iconfont').addClass('icon-dianzan1');
            tr = false;
            
         
             
            var numText = $(this).text();
            numText++;
            $(this).text(numText);  
             
         
            $.ajax({
                type:'GET',
                url:'../ideaServlet',
                dataType:'json',
                data:{
                     'ideaID':id2.text(),
                     'op':'upLikeNumber',
                     'likeNumber':that4.text(),
                     'userID':that5.text()
                },
                success:function(data){
                  console.log(data)
                }
            })
           
         
           }else{
               
           $(this).removeClass();
           $(this).addClass('iconfont').addClass('icon-qinziAPPtubiao-');
           tr = true;
           var numTex = $(this).text();
           numTex--;
           $(this).text(numTex);  


           $.ajax({
                type:'GET',
                url:'../ideaServlet',
                dataType:'json',
                data:{
                	 'ideaID':id2.text(),
                    'op':'upLikeNumber',
                    'likeNumber':that4.text(),
                    'userID':that5.text()
                },
                success:function(data){
                  console.log(data)
                }
            })


           }  
      
      })    
 
}


 // 上拉加载
    
     var outer = document.querySelector('#section');
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
        $('#section').css("padding-top",value);
 
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
          
       
          $('#section').css("padding-top","0.1rem"); 
        }
        if(top>0){
            
                $('#section').css("padding-top","0.1rem");
                
        }
          
    }, false);

    })
  


       

 


    
