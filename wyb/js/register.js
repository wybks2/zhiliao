$(function(){
    //  $.ajax({
    //      url:"boo.json",
    //      type:"GET",
    //      dataType:"json",
    //      success:function(res){
    //         console.log(res);
    //      }
    //  })
        var regStr=/[a-zA-Z]/;
		var regNum=/[0-9]/;
        var fStrNum=/\W/;
        $('#psd').keyup(function(){
            if($('#psd').val().length==0){
                $('.p11').html('');
                // $('.psd').css({'background-color':' #ffffff'});
                $('.psd').css({'background':'#ffffff'});
            }
			if ($("#psd").val().length<6&&$("#psd").val().length>0) {
                $('.psd').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
                $('.p11').html("请输入6位以上的密码!");
                $('.psd').css({'background-size':'0.5rem 0.5rem'});
                $('.psd').css({'background-color':' #ffffff'});
                $('.p11').css({'color':'red'});
			};
			if ($("#psd").val().length<=16) {
				if (($("#psd").val().length>=6&&regNum.test($("#psd").val())) || ($("#psd").val().length>=6&&regStr.test($("#psd").val()))) {
                    $('.psd').css({'background':'url("imgs/csj_26.png") 6.5rem 0.28rem no-repeat'});
                    $('.psd').css({'background-color':' #ffffff'});
                    $('.p11').html('');
				};
				if ($("#psd").val().length>=6&&regNum.test($("#psd").val())&&regStr.test($("#psd").val())) {
                    $('.psd').css({'background':'url("imgs/csj_27.png") 6.5rem 0.28rem no-repeat'});
                    $('.psd').css({'background-color':' #ffffff'});
                    $('.p11').html('');
				};
				if ($("#psd").val().length>=6&&regNum.test($("#psd").val())&&regStr.test($("#psd").val())&&fStrNum.test($("#psd").val())) {
                    $('.psd').css({'background':'url("imgs/csj_20.png") 6.5rem 0.28rem no-repeat'});
                    $('.psd').css({'background-color':' #ffffff'});
                    $('.p11').html('');
				}
			}else{
                $('.p11').html('请输入16位以内的密码!');
                $('.p11').css({'color':'red'});
			}
        })
        $('#psd').blur(function(){
            if($('#psd').val().length==0){
                $('.p11').html('请输入密码');
                // $('.psd').css({'background-color':' #ffffff'});
                $('.psd').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
                $('.psd').css({'background-size':'0.5rem 0.5rem'});
                $('.psd').css({'background-color':' #ffffff'});
                $('.p11').css({'color':'red'});
            }
        })
        
        $('#repeat').keyup(function(){
            if($('#repeat').val()!=$('#psd').val()){
                $('.p11').html('请输入相同的密码!');
                $('.repeat').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
                $('.repeat').css({'background-size':'0.5rem 0.5rem'});
                $('.repeat').css({'background-color':' #ffffff'});
                $('.p11').css({'color':'red'});
            }
            if($('#repeat').val().length==0){
                $('.p11').html('');
                $('.repeat').css({'background':'#ffffff'});
            }
            else if($('#repeat').val()===$('#psd').val()){
                $('.p11').html('密码一致!');
                $('.repeat').css({'background':'url("imgs/csj_10.png") 6.5rem 0.28rem no-repeat'});
                $('.repeat').css({'background-size':'0.5rem 0.5rem'});
                $('.repeat').css({'background-color':' #ffffff'});
                $('.p11').css({'color':' green'});
            }
        })
        $('#repeat').blur(function(){
            if($('#repeat').val().length==0){
                $('.p11').html('请输入密码');
                // $('.psd').css({'background-color':' #ffffff'});
                $('.repeat').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
                $('.repeat').css({'background-size':'0.5rem 0.5rem'});
                $('.repeat').css({'background-color':' #ffffff'});
                $('.p11').css({'color':'red'});
            }
        })
        
        $('#email').keyup(function(){
            var reg = new RegExp("^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$");
            if($('#email').val() === ""){ 
                  $('.p11').html('');
                  $('#email').css({'background':' #ffffff'});
            //    $('.p11').html('邮箱不能为空!');
            //    $('.p11').css({'color':'red'});
            //    $('#email').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
            //    $('#email').css({'background-size':'0.5rem 0.5rem'});
            //    $('#email').css({'background-color':' #ffffff'});
        　　}else if(!reg.test($('#email').val())){ 
               $('.p11').html('邮箱格式错误!');
               $('.p11').css({'color':'red'});
               $('#email').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
               $('#email').css({'background-size':'0.5rem 0.5rem'});
               $('#email').css({'background-color':' #ffffff'});
        　　}else{
                $('.p11').html('邮箱格式正确!');
                $('#email').css({'background':'url("imgs/csj_10.png") 6.5rem 0.28rem no-repeat'});
                $('#email').css({'background-size':'0.5rem 0.5rem'});
                $('#email').css({'background-color':' #ffffff'});
                $('.p11').css({'color':' green'});
        　　}
        })
        $('#email').blur(function(){
            if($('#email').val().length==0){
                $('.p11').html('请输入邮箱');
                // $('.psd').css({'background-color':' #ffffff'});
                $('#email').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
                $('#email').css({'background-size':'0.5rem 0.5rem'});
                $('#email').css({'background-color':' #ffffff'});
                $('.p11').css({'color':'red'});
            }
        })
    $("#sure").click(function(){
        // console.log(0);
           if($('#user').val()==="" || $('#psd').val()==="" || $('#repeat').val()==="" || $('#email').val()===""){
            $('.p11').html('用户名，密码或邮箱错误!');
            $('.p11').css({'color':'red'});
           }
           if($('#checkbox').prop('checked')==false&&$('#user').val()!=""&&$('#psd').val()!=""&&$('#repeat').val()!=""&&$('#email').val()!=""){
            $('.p11').html('请仔细阅读相关条款!');
            $('.p11').css({'color':'red'});
           }
           else if($('#checkbox').prop('checked')==true&&$('#user').val()!=""&&$('#psd').val()!=""&&$('#repeat').val()!=""&&$('#email').val()!=""){
            $('.p11').html('恭喜!注册成功');
            $('.p11').css({'color':'green'});
           }
            $.ajax({
            url:"../userServlet",
            type:"POST",
            dataType:"json",
            data:{"name":$("#user").val(),"password":$("#psd").val(),"email":$("#email").val(),"op":"addByNPE"},
            success: function(data){
                if(data[0].flag==-1){
                    $('.p11').html('抱歉!用户名已经存在!');
                    $('.p11').css({'color':'red'});
                }
                else if(data[0].flag==0){
                    $('.p11').html('抱歉!注册失败!');
                    $('.p11').css({'color':'red'});
                }
                else if(data[0].flag==1){
                    $('.p11').html('恭喜!注册成功!');
                    $('.p11').css({'color':'green'});
                }
            }           
        })
    })

    $('#user').keyup(function(){
        if($('#user').val().length==0){
            $('.p11').html('');
            // $('.psd').css({'background-color':' #ffffff'});
            $('#user').css({'background':' #ffffff'});
            $('.p11').css({'color':'red'});
        }
    })

    $('#user').blur(function(){
        if($('#user').val().length==0){
            $('.p11').html('请输入用户名!');
            // $('.psd').css({'background-color':' #ffffff'});
            $('#user').css({'background':'#ffffff'});
            $('#user').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
            $('#user').css({'background-size':'0.5rem 0.5rem'});
            $('#user').css({'background-color':' #ffffff'});
            $('.p11').css({'color':'red'});
        }
        if($('#user').val().length>0&&$('#user').val().length<4){
            $('.p11').html('请输入4-7位的用户名!');
            $('#user').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
            $('#user').css({'background-size':'0.5rem 0.5rem'});
            $('#user').css({'background-color':' #ffffff'});
            $('.p11').css({'color':'red'});
        }
        if($('#user').val().length>=4&&$('#user').val().length<=7&&regNum.test($("#user").val())||regStr.test($("#user").val())){
            $('.p11').html('用户名要输入数字和字母!');
            $('#user').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
            $('#user').css({'background-size':'0.5rem 0.5rem'});
            $('#user').css({'background-color':' #ffffff'});
            $('.p11').css({'color':'red'});
        }
        if($('#user').val().length>=4&&$('#user').val().length<=7&&regNum.test($("#user").val())&&regStr.test($("#user").val())){
            $('.p11').html('用户名格式正确!');
            $('#user').css({'background':'url("imgs/csj_10.png") 6.5rem 0.28rem no-repeat'});
            $('#user').css({'background-size':'0.5rem 0.5rem'});
            $('#user').css({'background-color':' #ffffff'});
            $('.p11').css({'color':' green'});
        }
        if($('#user').val().length>=4&&$('#user').val().length<=7&&fStrNum.test($("#user").val())){
            $('.p11').html('用户名只能输入数字和字母!');
            $('.p11').css({'color':'red'});
            $('#user').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
            $('#user').css({'background-size':'0.5rem 0.5rem'});
            $('#user').css({'background-color':' #ffffff'})
        }
        if($('#user').val().length>7){
            $('.p11').html('请输入4-7位的用户名!');
            $('#user').css({'background':'url("imgs/csj_28.png") 6.5rem 0.28rem no-repeat'});
            $('#user').css({'background-size':'0.5rem 0.5rem'});
            $('#user').css({'background-color':' #ffffff'});
            $('.p11').css({'color':'red'});
        }
        // console.log('aa');
        $.ajax({
            url:"../userServlet",
            type:"GET",
            dataType:"json",
            data:{"name":$("#user").val(),"op":"findByName"},
            success:function(data){
                if(data[0].flag==-1){
                    $('.p11').html('抱歉!用户名已经存在!');
                    $('.p11').css({'color':'red'});
                }
                else if(data[0].flag==0){
                    $('.p11').html('抱歉!用户名失效!');
                    $('.p11').css({'color':'red'});
                }
                else if(data[0].flag==1){
                    $('.p11').html('恭喜!用户名可用!');
                    $('.p11').css({'color':'green'});
                }
            }
        })
    })

    $('#clear').click(function(){
        $('.p11').html('');
        $('#user').val('');
        $('#psd').val('');
        $('#repeat').val('');
        $('#email').val('');
        $('#user').css({'background':' #ffffff'});
        $('#psd').css({'background':' #ffffff'});
        $('#repeat').css({'background':' #ffffff'});
        $('#email').css({'background':' #ffffff'});
        $('#checkbox').prop('checked',false);
    })

    $('.fan').click(function(){
        location.href='cz_PasswordLogin.html';
    })
})