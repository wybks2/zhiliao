$(function(){
	$('.icon-x').click(function(){
		$(this).parent().hide();
	})
	$('.fh').click(function(){
		window.location.href="dengluhou.html";
	});
	$('.ftj').click(function(){
		$(this).parent().hide();
		console.log('添加成功');
	});
	$('.qbgz').click(function(){
		$('.F_theme').hide();
		console.log('全部添加成功');
	});
	$('.hyp').click(function(){
        $.ajax({
            url:"name2.json",
			type:"GET",
			dataType:"json",
            success:function(data){
				console.log(data.res);
				var arr = data.res;
				$('.htbl').each(function (index,value) {
					$(this).html(arr[index].name);
				})
            }
        });
    })
});