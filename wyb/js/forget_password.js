$(function(){
    // $('.jiu-psd').blur(function(){
    //     var jp = $('.jiu-psd');
    //     if((jp.val().length >= 6) && (jp.val().length <= 12)) {
    //         console.log(111);
    //         jp.css('color','#51F0A0');
    //         // $.ajax({
    //         //     url:'1.json',
    //         //     ttype:'POST'
    //         //     data:{'jmm':$('.jiu-psd').val(),'op':'doadd'},
    //         //     dataType:'json',
    //         //     success:function(res) {
    //         //         console.log(res);
    //         //         if (jp.val() == aaaaa) {
    //         //             jp.css('color','#51F0A0');
    //         //         }
    //         //     }
    //         // });
    //     } else {
    //         alert('请输入正确的密码格式');
    //         jp.css('color','red');
    //     }
    // })

    $('.xin-psd').blur(function(){
        var xp = $('.xin-psd');
        if((xp.val().length >= 6) && (xp.val().length <= 12)) {
            xp.css('color','black');
            $('.xin-psds').blur(function(){
                var xps = $('.xin-psds');
                if((xps.val().length >= 6) && (xps.val().length <= 12)) {
                    if (xp.val() == xps.val()) {
                        xp.css('color','#51F0A0');
                        xps.css('color','#51F0A0');
                    } else {
                        alert('密码不一致');
                        xp.css('color','red');
                        xps.css('color','red');
                    }
                } else {
                    alert('请输入正确的密码格式');
                    xps.css('color','red');
                }
            })
        } else {
            alert('请输入正确的密码格式');
            xp.css('color','red');
        }
    })
    var xp = $('.xin-psd');
    var xps = $('.xin-psds');
    $('.get-btn').click(function(){
        if ((xp.val().length >= 6) && (xp.val().length <= 12)) {
            if ((xps.val().length >=6) && (xps.val().length <=12)) {
                if (xp.val == xps.val) {
                    console.log(123123123);
                    $.ajax({
                        url:'../userServlet',
                        type:'POST',
                        data:{
                        	'userID' : 1,
                        	'password':$('.xin-psds').val(),
                        	'op':'alertPassword'
                        },
                        dataType:'json',
                        success:function(res){
                            console.log(res);
                            if(res[0].flag == '1') {
                                $('.tips-ti').html('修改成功');
                                console.log(1);
                            } else {
                                alert('修改失败');
                                xp.val('');
                                xps.val('');
                            }
                        }
                    });
                } else {
                    alert('两次密码不一致');
                    xp.val('');
                    xps.val('');
                }
            } else {
                alert('第2个密码框内的格式不正确')
                xps.val('');
                xp.val('');
            }
        } else {
            alert('第1个密码框内的格式不正确');
            xp.val('');
            xps.val('');
        }
    }); 
    
});




$.ajax({
    url : "articleServlet",
    type : "POST",
    data : {"bt":$('.bt').val(),"nr":$('#text').val(),"op":"doadd"},
    dataType : "json",
    success:function (res) {
        a.val('');
        b.val('');
        if (res[0] == '1') {
            alert('发表成功');
        } else {
            alert('发表失败');
        }
    }
});