   $("#search").on('blur', function(e) {
        // var keycode = e.keyCode;
        // //获取搜索框的值
        // var searchContent = $(this).val();
        // if (keycode == '13') {
        //     e.preventDefault();
        //     //请求搜索接口
        //     if (searchContent == '') {
        //         alert('请输入检索内容！');
        //     } else {
        //         alert(searchContent);
        //         console.log(searchContent);
        //         }
        // }
        // alert(11)
         var a = $(this).val();
         if(a==''){
            alert('请输入检索内容');
         }else{
            $('.jieguo').children().remove();
            var a = $(this).val();
            console.log(a);
         $.ajax({
            url:'articleServlet',
            type:'GET',
            dataType:'json',
            data:{'op':'searchArticle','art_title':a},
            success:function(data){
                $.each(data,function(index,value){
                    var result = template('article',value);
                    $('.jieguo').append(result);
                })  
            },
            error: function(){
            alert("发生未知错误");
            }
        }) 
         }
         
    });
   $('.box1').click(function(){
    location.href='dengluhou.html';
   })