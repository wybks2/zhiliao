$(function(){
	$('#f_name').blur(function(){
		var yhm = $('#f_name');
		if (yhm.val().length == "") {
			console.log('用户名不得为空');
		} else {
			if (yhm.val().length > 2 && yhm.val().length <10) {
				$.ajax({
					url:"../userServlet",
					type:"POST",
					dataType:"json",
					data:{
						"userID" : 3,
						"name":$('#f_name').val(),
						"op":"findByName"
					},
					success:function(data){
						if (data[0].flag == -1) {
							yhm.val('');
							console.log('用户名重复');
						} else if (data[0].flag = '1') {
							console.log('用户名可用');
						} else {
							console.log('修改失败');
						}
					}
				});
				
			} else {
				yhm.val('');
				console.log('用户名小于2或者大于10');
			}
		}
	});
	
	var n = $('.ch_k1');
	var v = $('.ch_k2');
	n.click(function(){
		if (n.prop('checked',true)) {
			v.prop('checked',false);
		}
	});
	v.click(function(){
		if (v.prop('checked',true)) {
			n.prop('checked',false) 
		}
	});

	// 返回首页
	$('.fh').click(function(){
		window.location.href="dengluhou.html";
	});
	$('.htx').click(function(){
		$('.xhtx').toggle();
		// location.reload()
	});
});

