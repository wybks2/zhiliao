$(function(){
 
    $('.icon-feiji').click(function(){
        
        var text = $('#textarea');

        if(text.val().length!=0){
            console.log(text.val());
            
            $.ajax({
                type: 'GET',
                url: '../ideaServlet',
                data: { 
                    "tv":text.val(),
                    'userID':'9',
                    'op':'addIdea'
                },
                dataType: 'json',

                success: function(data){
                    console.log(data);
                    location.href='idea.html'; 
                    

                },
                
                
              })
            text.val('');
            
        } else {
            console.log('空');
        }
            
    })
})