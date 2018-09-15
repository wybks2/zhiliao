$(function () {
    // 单击登录事件
    $('.cz_Passlogin').click(function () {
          //发送ajax数据
          $.ajax({
            type:'POST',
            url:'../userServlet',
            data: {'op':'findByNP','name':$('#cz_passName').val(),'password':$('#cz_passCode').val()},
            dataType:'json',
            error:function () {
                alert('出错啦!');
            },
            success: function(data) {
                // $('.cz_remindInfo').html(data);
                if (data[0].flag == -1) {
                    $('.cz_remindInfo').text('用户名不存在,请注册');
                }else if (data[0].flag == 1){
                    location.href='dengluhou.html';
                }else {
                    $('.cz_remindInfo').text('用户名或密码输入错误');
                }
            }

        })
    })
})
